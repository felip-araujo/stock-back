import prisma from "../services/prismaClient.js";

export const getStats = async (req, res) => {
  try {
    // Contar total de eventos (visitas)
    const totalVisits = await prisma.analyticsEvent.count({
      where: { event: "visit" },
    });

    // Contar total de cliques registrados
    const totalClicks = await prisma.analyticsClick.count();

    // Somar o tempo total de permanência (eventos "leave" com duração)
    const totalTimeSpentResult = await prisma.analyticsEvent.aggregate({
      _sum: { duration: true },
      where: { event: "leave" },
    });

    const totalTimeSpent = totalTimeSpentResult._sum.duration || 0;

    res.status(200).json({
      totalVisits,
      totalClicks,
      totalTimeSpent,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      message: "Erro ao buscar estatísticas",
      error: error.message,
    });
  }
};