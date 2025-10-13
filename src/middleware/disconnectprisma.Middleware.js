// middleware/disconnectPrisma.js
import prisma from "../services/prismaClient.js";

export function disconnectPrisma(req, res, next) {
  // Log inicial da requisição
  console.log(`➡️ Requisição recebida: ${req.method} ${req.url}`);

  // Quando a resposta terminar, desconecta o Prisma
  res.on("finish", async () => {
    try {
      // Apenas desconecta se o Prisma ainda estiver conectado
      if (prisma && prisma.$connect) {
        await prisma.$disconnect();
        console.log("✅ Prisma desconectado com sucesso após a requisição");
      }
    } catch (err) {
      console.error("❌ Erro ao desconectar Prisma:", err.message || err);
    }
  });

  // Continua para a próxima rota/middleware
  next();
}