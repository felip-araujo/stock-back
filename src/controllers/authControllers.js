import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../services/prismaClient.js";

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

