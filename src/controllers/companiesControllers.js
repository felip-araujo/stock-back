import prisma from "../services/prismaClient.js";
import bcrypt from "bcrypt";

export const getCompany = async (req, res) => {
  const companyName = req.params.name;

  try {
    const company = await prisma.company.findMany({
      where: {
        name: companyName,
      },
    });
    if (!company || company.length === 0) {
      res.status(404).json({ message: "Nenhuma empresa encontrada." });
    } else {
      res.json(company);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createCompany = async (req, res) => {
  try {
    const { name, cnpj, representant, rep_email, rep_num, password } = req.body;

    if (!rep_email || !name || !password) {
      return res
        .status(400)
        .json({ message: "Nome, e-mail e senha são obrigatórios!" });
    }

    // Verifica se já existe empresa ou email
    const existingCompany = await prisma.company.findUnique({
      where: { cnpj },
    });
    if (existingCompany) {
      return res.status(400).json({ message: "Empresa já cadastrada!" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: rep_email },
    });
    if (existingUser) {
      return res.status(400).json({ message: "E-mail já está em uso!" });
    }

    // Cria empresa
    const newCompany = await prisma.company.create({
      data: {
        name,
        cnpj,
        representant,
        rep_email,
        rep_num,
      },
    });

    // Cria usuário administrador da empresa
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name: representant,
        email: rep_email,
        password: hashedPassword,
        role: "COMPANY_ADMIN",
        companyId: newCompany.id,
      },
    });

    res.status(201).json({
      message: "Empresa e administrador cadastrados com sucesso!",
      company: newCompany,
      nextStep: "Para ativar a assinatura, configure um método de pagamento e selecione um plano."
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const upcompany = await prisma.company.update({
      where: {
        name: req.params.name,
      },
      data: {
        name: req.body.name,
        type: req.body.type,
        representant: req.body.representant,
        rep_num: req.body.rep_num,
        rep_email: req.body.rep_email,
        cnpj: req.body.cnpj,
        password: req.body.password,
      },
    });
    res.status(200).json(upcompany);
  } catch (err) {
    res.status(500).json({ error: err.mensagem });
  }
};

export const deleteCompany = async (req, res) => {
  console.log(req);

  const compnyId = req.params.id;

  try {
    const deleteCompany = await prisma.company.delete({
      where: {
        id: Number(compnyId),
      },
    });

    if (!deleteCompany || deleteCompany.length === 0) {
      res.status(400).json({ message: "Nenhuma empresa deletada!" });
    }
    res.status(200).json({ message: "Empresa excluída com sucesso!" });
  } catch (err) {
    if ((err.code = "P2025")) {
      res
        .status(404)
        .json({ message: "Nenhuma empresa encontrada com o Id informado." });
    } else {
      res.status(400).json({ message: err });
    }
  }
};
