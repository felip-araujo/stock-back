import prisma from "../services/prismaClient.js";

export const criarRequisicao = async (req, res) => {
  const companyId = req.params.companyId;
  const { materialId, userId, quantity } = req.body;

  try {
    const novaRequisicao = await prisma.materialRequest.create({
      data: {
        materialId,
        userId,
        companyId: Number(companyId),
        quantity,
      },
    });

    res.status(200).json({ message: "Requisicão enviada", novaRequisicao });
  } catch (err) {
    res.status(400).json("Erro ao enviar requisicão", err);
    console.error(err);
  }
};
