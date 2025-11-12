import prisma from "../services/prismaClient.js";

export const createMaterial = async (req, res) => {
  const { name, description, group, companyId, codigo } = req.body;

  if (!name) {
    res.status(404).json({ message: "Nome do produto é obrigatório" });
  }

  if (!companyId) {
    res.status(404).json({ message: "Id de empresa obrigatório" });
  }
  try {
    const criar = await prisma.material.create({
      data: {
        name,
        description,
        group,
        companyId,
        codigo,
      },
    });

    res
      .status(200)
      .json({ message: "Produto criado com sucesso!", data: criar });
  } catch (err) {
    res.status(400).json({ message: "Erro ao criar produto", err });
    console.error(err);
  }
};


export const importarMateriais = async (req, res) => {
  try {
    const { materiais } = req.body;
    const companyId = Number(req.body.companyId)

    if (!companyId) {
      return res.status(400).json({ message: "Id da empresa é obrigatório." });
    }

    if (!materiais || !Array.isArray(materiais) || materiais.length === 0) {
      return res.status(400).json({ message: "Nenhum material enviado." });
    }

    // Mapeia e garante que cada material terá o companyId vinculado
    const dadosFormatados = materiais.map((m) => ({
      name: m.nome || m.name || "Sem nome",
      description: m.descricao || m.description || "",
      group: m.grupo || m.group || "",
      codigo: m.codigo || "",
      companyId: companyId,
    }));

    // Insere todos de uma vez
    const criar = await prisma.material.createMany({
      data: dadosFormatados,
      skipDuplicates: true, // evita duplicar se já existir (caso tenha unique no código, por exemplo)
    });

    return res.status(200).json({
      message: `${criar.count} materiais importados com sucesso!`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Erro ao importar materiais.",
      error: err.message,
    });
  }
};


export const verMaterial = async (req, res) => {
  const companyId = Number(req.params.companyId);
  const search = req.query.search ? req.query.search.toLowerCase() : "";

  if (!companyId) {
    return res.status(400).json({ message: "companyId é obrigatório." });
  }

  try {
    const where = {
      companyId,
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
            },
          },
          {
            name: {
              contains: search.charAt(0).toUpperCase() + search.slice(1),
            },
          },
        ],
      }),
    };

    const materiais = await prisma.material.findMany({
      where,
      skip: req.pagination.skip,
      take: req.pagination.take,
      orderBy: {
        name: "asc",
      },
    });

    const total = await prisma.material.count({ where });

    if (!materiais || materiais.length === 0) {
      return res
        .status(404)
        .json({ message: "Nenhum material encontrado para a empresa." });
    }

    res.status(200).json({
      data: materiais,
      pagination: {
        total,
        page: req.pagination.page,
        limit: req.pagination.limit,
        totalPages: Math.ceil(total / req.pagination.limit),
      },
    });
  } catch (err) {
    console.error("Erro ao buscar materiais:", err);
    res.status(500).json({
      message: "Erro ao buscar materiais",
      error: err.message,
    });
  }
};



export const verMaterialUnico = async (req, res) => {
  const companyId = req.params.companyId;
  const materialId = req.params.materialId;

  try {
    const material = await prisma.material.findMany({
      where: {
        companyId: Number(companyId),
        id: Number(materialId),
      },
    });

    res.status(200).json({ data: material });
  } catch (err) {
    res.status(400).json({ message: "Erro ao buscar material", err });
    console.error(err);
  }
};

export const editarMaterial = async (req, res) => {
  const companyId = req.params.companyId;
  const materialId = req.params.materialId;

  const { name, description, group, codigo } = req.body;
  try {
    const editarMatComp = await prisma.material.update({
      where: {
        companyId: Number(companyId),
        id: Number(materialId),
      },
      data: {
        name,
        description,
        group,
        codigo,
      },
    });

    res
      .status(200)
      .json({ message: "Material editado com sucesso.", data: editarMatComp });
  } catch (err) {
    res.status(400).json({ message: "Erro ao editar o produto", err });
    console.error(err);
  }
};

export const deleteMaterial = async (req, res) => {
  const companyId = req.params.companyId;
  const materialId = Number(req.params.materialId);

  const materialRequestExists = await prisma.requestItem.count({
    where: {
      materialId: materialId
    }
  })

  if (materialRequestExists >= 1) {
    res.status(400).json({ message: "Não é possível excluir: material em uso." })
  }

  try {
    const deletar = await prisma.material.delete({
      where: {
        companyId: Number(companyId),
        id: Number(materialId),
      },
    });

    res.status(200).json({ message: "Material deletado com sucesso!" });
  } catch (err) {
    res.status(400).json({ message: "Erro ao deletar material", err });
    console.error(err);
  }
};
