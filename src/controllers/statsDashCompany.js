import prisma from "../services/prismaClient.js";

export const dashStats = async (req, res) => {
  try {
    const companyId = Number(req.params.companyId); // se for por empresa

    const totalUsers = await prisma.user.count({ where: { companyId } });
    const totalProducts = await prisma.product.count({ where: { companyId } });
    const totalMaterial = await prisma.material.count({ where: { companyId } });
    const totalRequests = await prisma.request.count({where: { companyId },});
    const pendingRequests = await prisma.request.count({
      where: {
        companyId,
        status: "pending",
      },
    });
    const totalSale = await prisma.sale.count({
      where: {
        companyId
      }
    })

    res.status(200).json({
      totalUsers,
      totalProducts,
      totalMaterial,
      totalRequests,
      pendingRequests,
      totalSale
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
