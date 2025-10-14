import prisma from "../services/prismaClient.js";

export const createDepartment = async (req, res) => {
  const { name, companyId } = req.body;

  if (!name || !companyId) {
    return res.status(400).json({
      message: "Nome do departamento e ID da empresa são obrigatórios",
    });
  }

  try {
    const department = await prisma.department.create({
      data: {
        name,
        companyId: Number(companyId),
      },
    });

    return res.status(201).json({
      message: "Departamento criado com sucesso!",
      department,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({
        message: "Já existe um departamento com esse nome nesta empresa",
      });
    }
    return res.status(400).json({ message: "Erro ao criar departamento", err });
  }
};

export const getDepartmentsByCompany = async (req, res) => {
  const companyId = Number(req.params.companyId);

  try {
    const departments = await prisma.department.findMany({
      where: { companyId },
      include: {
        users: true, // Inclui os usuários do departamento
      },
    });

    res.status(200).json(departments);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateDepartment = async (req, res) => {
  const departmentId = Number(req.params.id);
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Nome do departamento é obrigatório",
    });
  }

  try {
    const department = await prisma.department.update({
      where: { id: departmentId },
      data: { name },
    });

    res.status(200).json({
      message: "Departamento atualizado com sucesso",
      department,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({
        message: "Já existe um departamento com esse nome nesta empresa",
      });
    }
    res.status(400).json({ message: "Erro ao atualizar departamento", err });
  }
};

export const deleteDepartment = async (req, res) => {
  const departmentId = Number(req.params.id);

  try {
    // Verifica se há usuários no departamento
    const usersInDepartment = await prisma.user.findMany({
      where: { departmentId },
    });

    if (usersInDepartment.length > 0) {
      return res.status(400).json({
        message: "Não é possível deletar o departamento pois há usuários vinculados a ele",
      });
    }

    await prisma.department.delete({
      where: { id: departmentId },
    });

    res.status(200).json({ message: "Departamento deletado com sucesso" });
  } catch (err) {
    res.status(400).json({ message: "Erro ao deletar departamento", err });
  }
};
