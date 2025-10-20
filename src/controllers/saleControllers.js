import prisma from "../services/prismaClient.js";

export const addSale = async (req, res) => {
  const {
    productId,
    userId,
    buyerName,
    buyerCpfCnpj,
    buyerEmail,
    buyerPhone,
    quantity,
  } = req.body;

  const companyId = Number(req.params.companyId);

  try {
    // 🧩 Verifica se o produto existe
    const produto = await prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!produto) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    // ⚠️ Verifica estoque suficiente
    if (produto.stock < quantity) {
      return res
        .status(400)
        .json({ message: "Estoque insuficiente para essa venda" });
    }

    // 💰 Calcula o valor total automaticamente
    const totalPrice = produto.price * Number(quantity);

    // 🧾 Transação: registra venda e atualiza estoque
    const novaVenda = await prisma.$transaction(async (tx) => {
      const venda = await tx.sale.create({
        data: {
          productId: Number(productId),
          userId: Number(userId),
          companyId: companyId,
          buyerName,
          buyerCpfCnpj,
          buyerEmail,
          buyerPhone,
          quantity: Number(quantity),
          totalPrice: totalPrice,
        },
      });

      await tx.product.update({
        where: { id: Number(productId) },
        data: { stock: produto.stock - Number(quantity) },
      });

      return venda;
    });

    res.status(200).json({
      message: "Venda registrada com sucesso",
      sale: novaVenda,
    });
  } catch (err) {
    console.error("Erro ao registrar venda:", err);
    res.status(500).json({
      message: "Erro ao registrar venda",
      error: err.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const getSalesDetail = async (req, res) => {
  const companyId = Number(req.params.companyId);

  const companyExists = await prisma.company.findUnique({
    where: {
      id: companyId,
    },
  });

  if (companyExists === null) {
    res.status(404).json({ message: "Empresa não cadastrada" });
    return;
  }

  try {
    const getSale = await prisma.sale.findMany({
      where: {
        companyId: companyId,
      },
    });

    if (getSale.length === 0) {
      res.status(400).json({ message: "Nenhuma venda regsitrada" });
      return;
    }

    res.status(200).json(getSale);
  } catch (err) {
    res.status(400).json({ message: "Erro ao buscar dados" });
    console.error(err);
  }
};

export const totalSalesValue = async (req, res) => {
  const companyId = Number(req.params.companyId);

  try {
    const total = await prisma.sale.aggregate({
      where: { companyId },
      _sum: {
        totalPrice: true,
      },
    });

    // total._sum.totalPrice pode ser null se não houver vendas ainda
    const totalValue = total._sum.totalPrice || 0;

    res.status(200).json({
      companyId,
      totalValue,
      message: "Valor total de vendas calculado com sucesso!",
    });
  } catch (err) {
    console.error("Erro ao calcular total de vendas:", err);
    res.status(500).json({ message: "Erro ao calcular total de vendas", err });
  }
};

export const totalSalesValueForUser = async (req, res) => {
  const companyId = Number(req.params.companyId);
  const userId = Number(req.params.userId);

  try {
    const total = await prisma.sale.aggregate({
      where: { companyId, userId},
      _sum: {
        totalPrice: true,
      },
    });

    // total._sum.totalPrice pode ser null se não houver vendas ainda
    const totalValue = total._sum.totalPrice || 0;

    res.status(200).json({
      companyId,
      totalValue,
      message: "Valor total de vendas do usuário calculado com sucesso!",
    });
  } catch (err) {
    console.error("Erro ao calcular total de vendas:", err);
    res.status(500).json({ message: "Erro ao calcular total de vendas", err });
  }
};
