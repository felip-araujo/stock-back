import prisma from "../services/prismaClient.js";
import bcrypt from "bcrypt"

export const registerWithInvite = async (req, res) => {
  try {
    const { name, email, password, inviteToken } = req.body;

    if (!name || !email || !password || !inviteToken) {
      return res.status(400).json({ message: "Campos obrigatórios não preenchidos" });
    }

    // Verifica se o token é válido
    const invite = await prisma.inviteLink.findUnique({
      where: { token: inviteToken },
    });

    if (!invite) {
      return res.status(400).json({ message: "Convite inválido" });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ message: "Este convite expirou" });
    }

    // Verifica se o usuário já existe
    const userExist = await prisma.user.findUnique({
      where: { email },
    });

    if (userExist) {
      return res.status(400).json({ message: "Usuário já cadastrado com este email" });
    }

    // Verifica o plano da empresa
    const subscription = await prisma.subscription.findFirst({
      where: { companyId: invite.companyId },
    });

    if (!subscription) {
      return res.status(400).json({ message: "Plano da empresa não encontrado" });
    }

    // Conta quantos usuários a empresa já possui
    const userCount = await prisma.user.count({
      where: { companyId: invite.companyId },
    });

    // Bloqueia cadastro se plano for basic e limite atingido
    if (subscription.plan === "basic" && userCount >= 10) {
      return res.status(403).json({
        message: "Seu plano atual permite no máximo 10 usuários. Faça upgrade para cadastrar mais.",
      });
    }

    // Cria o usuário
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        companyId: invite.companyId,
        role: invite.role,
        inviteId: invite.id, // registra de qual link veio
      },
    });

    return res.status(201).json({
      message: "Usuário criado com sucesso!",
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao registrar usuário", err}); 
  }
};

