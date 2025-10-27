import prisma from "../services/prismaClient.js";

export const cancelCreate = async (req, res) => {
  const userId = Number(req.body.userId);
  const motivo = req.body.motivo;

  try {
    const formGo = await prisma.cancelamento.create({
      data: {
        userId,
        motivo,
      },
    });

    res.status(200).json({ message: "Assinatura cancelada," });
  } catch (err) {
    res.status(400).json(err);
    console.error(err);
  }
};

export const getCancel = async (req, res) => {
  try {
    const dados = await prisma.cancelamento.findMany()
    if (dados.length > 0) {
      res.status(200).json(dados)
    }

    res.status(404).json({ message: "Não há nenhum pedido de cancelamento." })
  } catch (err) {
    res.status(400).json({ erro: "Erro ao buscar dados", err }
    )
    console.error(err)
  }
}



