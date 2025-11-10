import prisma from "./prismaClient.js";

export const analyticsService = {
  async registerEvent(data, ipAddress, userAgent) {
    return await prisma.analyticsEvent.create({
      data: {
        event: data.event,
        page: data.page,
        element: data.element || null,
        duration: data.duration || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  },

  async getSummary() {
    const totalVisits = await prisma.analyticsEvent.count({
      where: { event: "visit" },
    });

    const totalClicks = await prisma.analyticsEvent.count({
      where: { event: "click" },
    });

    const totalTime = await prisma.analyticsEvent.aggregate({
      _sum: { duration: true },
    });

    return {
      totalVisits,
      totalClicks,
      totalTimeSpent: totalTime._sum.duration || 0,
    };
  },

  async getEventsByPage(page) {
    return await prisma.analyticsEvent.findMany({
      where: { page },
      orderBy: { timestamp: "desc" },
    });
  },

  // 🔹 NOVO: registrar cliques em botões
  async registerClick(buttonId, page) {
    return await prisma.analyticsClick.create({
      data: {
        buttonId,
        page,
      },
    });
  },
};
