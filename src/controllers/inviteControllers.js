import prisma from "../services/prismaClient.js";
import crypto from "crypto"

export const generateInvite = async (req, res) => {
    try {
        const { companyId, role } = req.body;

        if (!companyId) {
            return res.status(400).json({ message: "companyId é obrigatório" });
        }

        // Gera token único
        const token = crypto.randomBytes(20).toString("hex");

        // Define validade (7 dias)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Cria o link no banco
        const invite = await prisma.inviteLink.create({
            data: {
                token,
                companyId: Number(companyId),
                role: role || "EMPLOYEE",
                expiresAt,
            },
        });

        const inviteUrl = `${process.env.FRONTEND_URL}/register?invite=${token}`;

        return res.status(201).json({
            message: "Link de convite gerado com sucesso!",
            inviteUrl,
            expiresAt,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Erro ao gerar link", error: err.message });
    }
};

