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

export const verRequisicoes = async (req, res) => {
  const companyId = req.params.companyId;

  try {
    const verRequisicoes = await prisma.materialRequest.findMany({
      relationLoadStrategy: "join",
      include: {
        user: true,
        material: true,
      },
      where: {
        companyId: Number(companyId),
      },

      skip: req.pagination.skip,
      take: req.pagination.take,
    });

    const total = await prisma.materialRequest.count();

    res.status(200).json({
      data: verRequisicoes,
      pagination: {
        total,
        page: req.pagination.page,
        limit: req.pagination.limit,
        totalPages: Math.ceil(total / req.pagination.limit),
      },
    });
  } catch (err) {
    res.status(400).json({ message: "Erro ao buscar requisições" });
    console.error(err);
  }
};

export const verRequisicaoPorUsuario = async (req, res) => {
  const idUsuario = req.body.idUsuario;

  if (!idUsuario || idUsuario === null) {
    res.status(400).json({ message: "Id do usuaário nao fornecido" });
  }

  try {
    const reqsById = await prisma.materialRequest.findMany({
      where: {
        userId: idUsuario,
      },
      skip: req.pagination.skip,
      take: req.pagination.take,
    });

    const total = prisma.materialRequest.count({
      where: {
        userId: idUsuario,
      },
    });

    if (reqsById.length === 0) {
      res
        .status(404)
        .json({ message: "Nehuma requisição encontrada para o usuario" });
    }

    res.status(200).json({
      data: reqsById,
      pagination: {
        total,
        page: req.pagination.page,
        limit: req.pagination.limit,
        totalPages: Math.ceil(total / req.pagination.limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Erro ao buscar requisições" });
  }
};

export const excludeRequisicoes = async (req, res) => {
  const companyId = req.params.companyId;
  const idRequisicao = req.params.idRequisicao;

  try {
    const excluir = await prisma.materialRequest.delete({
      where: {
        companyId: Number(companyId),
        id: Number(idRequisicao),
      },
    });
    res.status(200).json({ message: "Requisição Excluída com suceso" });
  } catch (err) {
    res.status(400).json({ message: "Erro ao excluir requisição", err });
    console.error(err);
  }
};

export const gerenciarRequisicoes = async (req, res) => {
  const companyId = req.params.companyId;
  const idRequisicao = req.params.idRequisicao;
  const status = req.body.status;

  try {
    const alterar = await prisma.materialRequest.update({
      where: {
        companyId: Number(companyId),
        id: Number(idRequisicao),
      },
      data: {
        status: status,
      },
    });

    res.status(200).json({ message: "Status alterado com sucesso:", status });
  } catch (err) {
    res.status(400).json({ message: "Erro ao atualizar requisição" });
    console.error(err);
  }
};
