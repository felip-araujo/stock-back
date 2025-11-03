// middlewares/searchMiddleware.js
import prisma from "../services/prismaClient.js";

const modelos = [
  { name: "material", hasCompanyId: true },
  { name: "user", hasCompanyId: true },
  { name: "product", hasCompanyId: false }, // ajusta conforme seu schema
  { name: "sale", hasCompanyId: false }
];

export async function searchMiddleware(req, res, next) {
  const query = req.query.q?.trim();
  const { companyId } = req.params;

  if (!query) return next();

  const resultados = [];

  for (const modelo of modelos) {
    try {
      // verifica se o modelo existe no Prisma e possui findMany
      if (typeof prisma[modelo.name]?.findMany === "function") {
        const whereClause = { name: { contains: query } };

        // só adiciona companyId se o modelo tiver esse campo
        if (modelo.hasCompanyId && companyId) {
          whereClause.companyId = Number(companyId);
        }

        const registros = await prisma[modelo.name].findMany({
          where: whereClause,
        });

        resultados.push(...registros.map((r) => ({ tipo: modelo.name, ...r })));
      }
    } catch (err) {
      console.warn(`⚠️ Falha ao buscar em ${modelo.name}:`, err.message);
    }
  }

  if (resultados.length > 0) {
    return res.json(resultados);
  }

  // caso não encontre nada, passa para a próxima rota
  next();
}
