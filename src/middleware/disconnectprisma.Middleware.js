// middleware/disconnectPrisma.js
import prisma from "../prismaClient.js";

export async function disconnectPrisma(req, res, next) {
  res.on("finish", async () => {
    try {
      await prisma.$disconnect();
    } catch (err) {
      console.error("Erro ao desconectar Prisma:", err);
    }
  });
  next();
}
