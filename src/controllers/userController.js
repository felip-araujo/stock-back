import prisma from "../services/prismaClient.js";
import bcrypt from "bcrypt";
// import { paginate } from "../middleware/paginate.Middeware.js";

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
  try {
    const companyId = Number(req.params.companyId);

    // busca com paginação
    const users = await prisma.user.findMany({
      where: { companyId },
      skip: req.pagination.skip,
      take: req.pagination.take,
    });

    // total de registros
    const total = await prisma.user.count({
      where: { companyId },
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "Nenhum usuário encontrado." });
    }

    res.status(200).json({
      data: users,
      pagination: {
        total,
        page: req.pagination.page,
        limit: req.pagination.limit,
        totalPages: Math.ceil(total / req.pagination.limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const updateUsers = async (req, res) => {
  const companyId = req.params.companyId;
  const idUsuario = req.params.id;
  const { name, email, role, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const edit = await prisma.user.update({
      where: {
        companyId: Number(companyId),
        id: Number(idUsuario),
      },
      data: {
        name,
        email,
        role,
        password: hashedPassword,
      },
    });

    if (!edit || (edit.length === 0) | (edit === null)) {
      res
        .status(400)
        .json({ message: "Não foi possível editar o usuario", err });
    }

    res.status(200).json({ message: "Usuario editado com sucesso!", edit });
  } catch (err) {
    res.status(400).json({ message: "Erro na requsição", err });
  }
};

export const deleteUsers = async (req, res) => {
  const id_enviado = req.params.id;
  const companyId = req.params.companyId;

  try {
    const deletar = await prisma.user.delete({
      where: {
        companyId: Number(companyId),
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
