import cors from "cors"


import express, { json } from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.listen(3000, () => {
  console.log("Server running on port 3000");
});


app.use(cors({
  origin: [
    "http://localhost:5173", // seu ambiente local
    "https://stocksafe.vercel.app" // frontend hospedado no Vercel
  ]
}));

app.post("/companies", async (req, res) => {
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

    res.status(201).json(company); // retorna a empresa criada
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/companies", async (req, res) => {
  const companies = await prisma.companies.findMany();
  res.status(200).json(companies)
});
