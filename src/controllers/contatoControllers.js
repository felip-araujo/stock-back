import prisma from "../services/prismaClient.js";
import nodemailer from "nodemailer"

export const newContact = async (req, res) => {
  const { nome, email, telefone, mensagem } = req.body;

  if (!nome || !email || !telefone || !mensagem) {
    return res.status(400).json({ message: "Passe todos os dados solicitados!" });
  }

  try {
    // Salva o contato no banco
    const novo = await prisma.contato.create({
      data: {
        nome,
        email,
        telefone,
        mensagem,
      },
    });

    // Configuração do transporte (ajuste conforme o provedor)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "SEU_EMAIL@gmail.com",
        pass: "SUA_SENHA_DE_APP", // use senha de app, não senha real!
      },
    });

    // Conteúdo do e-mail
    const mailOptions = {
      from: `"Formulário de Contato - Stock Seguro" <SEU_EMAIL@gmail.com>`,
      to: "felipedgart@gmail.com",
      subject: "Novo contato recebido pelo site Stock Seguro",
      html: `
        <h2>Novo contato recebido</h2>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefone:</strong> ${telefone}</p>
        <p><strong>Mensagem:</strong><br>${mensagem}</p>
        <br>
        <p>Enviado automaticamente pelo sistema Stock Seguro.</p>
      `,
    };

    // Envia o e-mail
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Contato enviado com sucesso!" });
  } catch (err) {
    console.error("Erro ao enviar contato:", err);
    res.status(500).json({ message: "Erro ao enviar formulário." });
  }
};

export const getContact = async (req, res) => {
  const contatos = await prisma.contato.findMany({
    skip: req.pagination.skip,
    take: req.pagination.take,
  });

  if (contatos.legth === 0) {
    res.status(404).json({ message: "Nenhum contato encontrado!" });
  }

  const total = await prisma.contato.count();

  res.status(200).json({
    data: contatos,
    pagination: {
      total,
      page: req.pagination.page,
      limit: req.pagination.limit,
      totalPages: Math.ceil(total / req.pagination.limit),
    },
  });
};
