import prisma from "../services/prismaClient.js";

export const criarRequisicao = async (req, res) => {
  const companyId = req.params.companyId;
  const { userId, items } = req.body; // items: [{ materialId, quantity }, ...]

  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "userId e items (array de materiais com materialId e quantity) são obrigatórios",
    });
  }

  try {
    // Verificar se todos os materiais existem e pertencem à empresa
    const materialIds = items.map(item => item.materialId);
    const materials = await prisma.material.findMany({
      where: {
        id: { in: materialIds },
        companyId: Number(companyId),
      },
    });

    if (materials.length !== materialIds.length) {
      return res.status(400).json({
        message: "Um ou mais materiais não existem ou não pertencem à empresa",
      });
    }

    // Criar a requisição com itens
    const novaRequisicao = await prisma.request.create({
      data: {
        userId: Number(userId),
        companyId: Number(companyId),
        items: {
          create: items.map(item => ({
            materialId: item.materialId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            material: true,
          },
        },
        user: true,
      },
    });

    res.status(201).json({ message: "Requisição criada com sucesso", novaRequisicao });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Erro ao criar requisição", error: err.message });
  }
};

export const verRequisicoes = async (req, res) => {
  const companyId = Number(req.params.companyId);
  const search = req.query.search?.trim() || "";

  try {
    const where = { companyId };

    if (search) {
      where.OR = [
        {
          user: {
            name: {
              contains: search,
            },
          },
        },
        {
          user: {
            department: {
              name: {
                contains: search,
              },
            },
          },
        },
        {
          items: {
            some: {
              material: {
                name: {
                  contains: search,
                },
              },
            },
          },
        },
      ];
    }

    const verRequisicoes = await prisma.request.findMany({
      where,
      include: {
        user: {
          include: {
            department: true,
          },
        },
        items: {
          include: {
            material: true,
          },
        },
      },
      skip: req.pagination.skip,
      take: req.pagination.take,
      orderBy: {
        createdAt: "desc",
      },
    });

    const total = await prisma.request.count({
      where,
    });

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
    console.error(err);
    res.status(400).json({ message: "Erro ao buscar requisições" });
  }
};


export const verRequisicaoPorUsuario = async (req, res) => {
  const companyId = req.params.companyId;
  const idUsuario = req.params.idUsuario;
  const search = req.query.search?.trim();

  if (!idUsuario) {
    return res.status(400).json({ message: "Id do usuário não fornecido" });
  }
  if (!companyId) {
    return res.status(400).json({ message: "companyId não fornecido" });
  }

  try {
    const whereClause = {
      userId: Number(idUsuario),
      companyId: Number(companyId),
    };

    // 🔍 Se houver termo de busca, adiciona OR para procurar em usuário, departamento ou material
    if (search && search.length > 0) {
      whereClause.OR = [
        {
          user: {
            name: {
              contains: search,
              // Prisma 6.16.3 — usar equals insensível a maiúsculas/minúsculas via regex-like
              mode: undefined, // removido para compatibilidade
            },
          },
        },
        {
          user: {
            department: {
              name: {
                contains: search,
              },
            },
          },
        },
        {
          items: {
            some: {
              material: {
                name: {
                  contains: search,
                },
              },
            },
          },
        },
      ];
    }

    const reqsById = await prisma.request.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            material: true,
          },
        },
        user: {
          include: {
            department: true,
          },
        },
      },
      skip: req.pagination.skip,
      take: req.pagination.take,
      orderBy: {
        createdAt: "desc",
      },
    });

    const total = await prisma.request.count({
      where: whereClause,
    });

    if (reqsById.length === 0) {
      return res.status(404).json({
        message: "Nenhuma requisição encontrada para o usuário",
      });
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
    const excluir = await prisma.request.delete({
      where: {
        id: Number(idRequisicao),
        companyId: Number(companyId),
      },
    });
    res.status(200).json({ message: "Requisição Excluída com sucesso" });
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
    const alterar = await prisma.request.update({
      where: {
        id: Number(idRequisicao),
        companyId: Number(companyId),
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
