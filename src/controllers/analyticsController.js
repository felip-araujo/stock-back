import { analyticsService } from "../services/analyticsService.js";
import prisma from "../services/prismaClient.js";

export const analyticsController = {
    async create(req, res) {
        try {
            const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
            const userAgent = req.headers["user-agent"];

            const event = await analyticsService.registerEvent(req.body, ipAddress, userAgent);
            res.status(201).json(event);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Erro ao registrar evento" });
        }
    },

    async summary(req, res) {
        try {
            const data = await analyticsService.getSummary();
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ message: "Erro ao buscar resumo" });
        }
    },

    async getByPage(req, res) {
        try {
            const { page } = req.params;
            const data = await analyticsService.getEventsByPage(page);
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ message: "Erro ao buscar eventos da página" });
        }
    },


    async registerClick(req, res) {
        try {
            const { buttonId, page } = req.body;

            // 🧩 Validação básica
            if (!buttonId) {
                return res.status(400).json({ error: "buttonId é obrigatório." });
            }

            // 💾 Criação no banco
            const click = await prisma.analyticsClick.create({
                data: {
                    buttonId,
                    page: page || null,
                },
            });

            // ✅ Retorno de sucesso
            return res.status(201).json({
                message: "Clique registrado com sucesso.",
                click,
            });
        } catch (error) {
            console.error("Erro ao registrar clique:", error);
            return res
                .status(500)
                .json({ error: "Erro interno ao registrar clique." });
        }
    },


};