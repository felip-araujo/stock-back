import prisma from '../services/prismaClient.js';

export const getCompanies = async (req, res) => {
  try {
    const companies = await prisma.companies.findMany();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createCompany = async (req, res) => {
  try {
    const company = await prisma.companies.create({
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
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
