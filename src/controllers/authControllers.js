import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../services/prismaClient.js";
import { sendRecoveryEmail } from "../services/emailService.js";
import dotenv from "dotenv";

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
  // res.status(400).json(email)

  try {
    // const user = await prisma.user.findUnique({ where: { email } });

    const user = await prisma.user.findMany({
      where: {
        email: email,
      },
    });
    if (!user)
      return res.status(404).json({ message: "Usuário não encontrado." });

    // Criar token temporário (1h de validade)
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });


    // Enviar email
    await sendRecoveryEmail(email, token);

    res.status(200).json({ message: "Email de recuperação enviado." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro interno." });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: payload.userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Senha atualizada com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Token inválido ou expirado." });
  }
};
