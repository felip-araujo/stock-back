import prisma from "../services/prismaClient.js";
import bcrypt from "bcrypt";

export const getCompanies = async (req, res) => {
  const companyName = req.params.name;

  try {
    const companies = await prisma.companies.findMany({
      where: {
        name: companyName,
      },
    });
    if (!companies || companies.length === 0) {
      res.status(400).json({ message: "Nenhuma empresa encontrada." });
    } else {
      res.json(companies);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createCompany = async (req, res) => {
  try {
    const { name, type, representant, rep_num, rep_email, cnpj, password } =
      req.body;

    if (!rep_email || !name || !password) {
      res
        .status(400)
        .json({ message: "Nome, e-mail, e senha são obrigatórios!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCompany = await prisma.companies.create({
      data: {
        name,
        type,
        representant,
        rep_num,
        rep_email,
        cnpj,
        password: hashedPassword,
      },
    });
    res.status(201).json({ message: "Cadastro Realizado!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const upcompany = await prisma.companies.update({
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
    const deleteCompany = await prisma.companies.delete({
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
        .status(400)
        .json({ message: "Nenhuma empresa encontrada com o Id informado." });
    } else {
      res.status(400).json({ message: err });
    }
  }
};
