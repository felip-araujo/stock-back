import prisma from "../services/prismaClient.js";

export const newContact = async (req, res) => {
  const { nome, email, telefone, mensagem } = req.body;

  if (!nome || !email || !telefone || !mensagem) {
    res.status(400).json({ message: "Passe todos os dados solicitados!" });
  }

  try {
    const novo = await prisma.contato.create({
      data: {
        nome,
        email,
        telefone,
        mensagem,
      },
    });

    res.status(200).json({ message: "Contato enviado!" });
  } catch (err) {
    res.status(400).json({ message: "Erro ao enviar formulário" });
    console.err(err);
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
