import prisma from "../services/prismaClient.js";
import bcrypt from "bcrypt";

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, companyId } = req.body;

    if (!name || !password || !companyId || !email || !role) {
      return res.status(400).json({
        message: "Nome, senha, id_empresa, email e função são obrigatórios",
      });
    }

    const userExist = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (userExist) {
      return res.status(400).json({ message: "Usuário já existe!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        companyId,
      },
    });
    return res
      .status(201)
      .json({ message: "Usuário Criado com Sucesso", user });
  } catch (err) {
    res.status(400).json({ message: err });
  }
};

export const getUsers = async (req, res) => {
  const user = await prisma.user.findMany();
  if (!user || user.length === 0) {
    res.status(400).json({ message: "Nenhum usuário encontrado." });
  } else {
    res.status(200).json(user);
  }
};

export const deleteUsers = async (req, res) => {
  const id_enviado = req.params.id;

  try {
    const deletar = await prisma.user.delete({
      where: {
        id: Number(id_enviado),
      },
    });
    if (deletar) {
      return res.status(200).json({ message: "Usuário deletado com sucesso!" });
    }
  } catch (err) {
    res.status(400).json(err);
  }
};
