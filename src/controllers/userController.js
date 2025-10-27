import prisma from "../services/prismaClient.js";
import bcrypt from "bcrypt";
// import { paginate } from "../middleware/paginate.Middeware.js";

export const createUser = async (req, res) => {
  const { name, email, password, role, companyId, departmentId } = req.body;

  try {
    if (!name || !password || !companyId || !email || !role) {
      return res.status(400).json({
        message: "Nome, senha, id_empresa, email e função são obrigatórios",
      });
    }

    // Busca o plano da empresa
    const subscription = await prisma.subscription.findFirst({
      where: { companyId: Number(companyId) },
    });

    if (!subscription) {
      return res.status(400).json({
        message: "Plano da empresa não encontrado",
      });
    }

    // Verifica quantos usuários já existem na empresa
    const userCount = await prisma.user.count({
      where: { companyId: Number(companyId) },
    });

    // Se o plano for básico e já tiver 10 usuários, bloqueia o cadastro
    if (subscription.plan === "basic" && userCount >= 10) {
      return res.status(403).json({
        message: "Seu plano atual permite no máximo 10 usuários. Faça upgrade para cadastrar mais.",
      });
    }

    // Verifica se o e-mail já existe
    const userExist = await prisma.user.findUnique({
      where: { email },
    });
    if (userExist) {
      return res.status(400).json({ message: "Usuário já existe!" });
    }

    // Verifica se o departamento pertence à empresa
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: Number(departmentId) },
      });
      if (!department || department.companyId !== Number(companyId)) {
        return res.status(400).json({
          message: "Departamento inválido ou não pertence à empresa",
        });
      }
    }

    // Cria o usuário
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        companyId: Number(companyId),
        departmentId: departmentId ? Number(departmentId) : null,
      },
    });

    return res.status(201).json({
      message: "Usuário criado com sucesso",
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Erro ao criar usuário",
      error: err.message,
    });
  }
};


export const getUsers = async (req, res) => {
  try {
    const companyId = Number(req.params.companyId);

    // busca com paginação
    const users = await prisma.user.findMany({

      include: {
        department: true,
      },
      where: { companyId },
      skip: req.pagination.skip,
      take: req.pagination.take,
    });

    // total de registros
    const total = await prisma.user.count({
      where: { companyId },
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "Nenhum usuário encontrado." });
    }

    res.status(200).json({
      data: users,
      pagination: {
        total,
        page: req.pagination.page,
        limit: req.pagination.limit,
        totalPages: Math.ceil(total / req.pagination.limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUsers = async (req, res) => {
  const companyId = req.params.companyId;
  const idUsuario = req.params.id;
  const { name, email, role, password, departmentId } = req.body;

  try {
    // Construir dados para atualização
    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (password !== undefined) data.password = await bcrypt.hash(password, 10);

    // Verifica se o departamento existe e pertence à empresa
    if (departmentId !== undefined) {
      if (departmentId === null) {
        data.departmentId = null;
      } else {
        const department = await prisma.department.findUnique({
          where: { id: Number(departmentId) },
        });
        if (!department || department.companyId !== Number(companyId)) {
          return res.status(400).json({
            message: "Departamento inválido ou não pertence à empresa",
          });
        }
        data.departmentId = Number(departmentId);
      }
    }

    // Verificar se pelo menos um campo foi fornecido
    if (Object.keys(data).length === 0) {
      return res
        .status(400)
        .json({
          message: "Pelo menos um campo deve ser fornecido para edição.",
        });
    }

    const edit = await prisma.user.update({
      where: {
        companyId: Number(companyId),
        id: Number(idUsuario),
      },
      data,
    });

    if (!edit || (edit.length === 0) | (edit === null)) {
      res
        .status(400)
        .json({ message: "Não foi possível editar o usuario", err });
    }

    res.status(200).json({ message: "Usuario editado com sucesso!", edit });
  } catch (err) {
    res.status(400).json({ message: "Erro na requsição", err });
  }
};

export const deleteUsers = async (req, res) => {
  const id_enviado = Number(req.params.id);
  const companyId = Number(req.params.companyId);

  try {
    await prisma.$transaction([
      prisma.sale.deleteMany({
        where: { userId: id_enviado },
      }),
      prisma.request.deleteMany({
        where: { userId: id_enviado },
      }),
      prisma.user.delete({
        where: {
          id: id_enviado,
          companyId: companyId,
        },
      }),
    ]);

    return res.status(200).json({ message: "Usuário e dados vinculados deletados com sucesso!" });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      message: "Erro ao deletar usuário. Verifique se há vínculos com outras tabelas.",
      error: err.message,
    });
  }
};


export const verMeusDados = async (req, res) => {
  const companyId = req.params.companyId;
  const userId = req.params.userId;

  try {
    const verDados = await prisma.user.findUnique({
      where: {
        companyId: Number(companyId),
        id: Number(userId),
      },
    });

    res.status(200).json({ data: verDados });
  } catch (err) {
    res.status(400).json({ message: "Erro ao buscar dados do usuário" });
  }
};

export const alterarSenha = async (req, res) => {
  const id_enviado = req.params.id;
  const companyId = req.params.companyId;
  const newPassword = req.body.newPassword; // <-- nome correto

  try {
    // validação
    if (!newPassword) {
      return res.status(400).json({ message: "Nova senha é obrigatória" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: Number(id_enviado) },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Senha alterada com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Erro ao alterar senha", error: err });
  }
};
