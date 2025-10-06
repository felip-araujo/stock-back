import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../services/prismaClient.js";
import { sendRecoveryEmail } from "../services/emailService.js";
import dotenv from "dotenv";
import { json } from "express";

dotenv.config();

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "E-mail e senha são obrigatórios!" });
    }

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }, // se quiser trazer dados da empresa
    });

    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado!" });
    }

    // Valida senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Senha inválida!" });
    }

    // Gera token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        companyId: user.companyId || null,
      },
      process.env.JWT_SECRET || "seusegredo", // use variável de ambiente no .env
      { expiresIn: "1d" } // expira em 1 dia
    );

    // Retorna infos sem expor a senha
    const { password: _, ...userData } = user;

    res.json({
      message: "Login realizado com sucesso!",
      token,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const requestPasswordRecovery = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return res.status(404).json({ message: "Usuário não encontrado." });

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // ex: "493281"
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expira em 5 min

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      code,
      expiresAt,
    },
  });

  // enviar e-mail com o código
  await sendRecoveryEmail(user.email, `Seu código de redefinição: ${code}`);

  res.json({ message: "Código enviado para seu e-mail.", user });
};

export const resetPassword = async (req, res) => {
  const { id, code, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user)
    return res.status(404).json({ message: "Usuário não encontrado." });

  const resetRequest = await prisma.passwordReset.findFirst({
    where: {
      userId: user.id,
      code,
      expiresAt: { gt: new Date() }, // ainda válido
    },
  });

  if (!resetRequest)
    return res.status(400).json({ message: "Código inválido ou expirado." });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await prisma.passwordReset.delete({ where: { id: resetRequest.id } }); // remove o código

  res.json({ message: "Senha redefinida com sucesso!" });
};

export const codeVerify = async (req, res) => {
  const clientCode = req.body.code;

  if (!clientCode) {
    return res
      .status(400)
      .json({ success: false, message: "Código não fornecido." });
  }

  try {
    const record = await prisma.passwordReset.findFirst({
      where: {
        code: clientCode,
        expiresAt: {
          gte: new Date(), // verifica se ainda não expirou
        },
      },
      include: {
        user: true, // se quiser acessar dados do usuário
      },
    });

    if (!record) {
      return res
        .status(400)
        .json({ success: false, message: "Código inválido ou expirado." });
    }

    // opcional: pode deletar o código depois de usado
    // await prisma.passwordReset.delete({ where: { id: record.id } });

    return res
      .status(200)
      .json({
        success: true,
        message: "Código válido!",
        userId: record.userId,
      });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Erro ao verificar o código." });
  }
};
