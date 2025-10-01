import prisma from "../services/prismaClient.js";

export const addProduct = async (req, res) => {
  const { name, description, price, stock, companyId } = req.body;
  if (!name || !description || !price || !stock || !companyId) {
    return res.status(400).json({
      message:
        "Nome, descrição, preço, quantidade em estoque e empresa são obrigatórios",
    });
  }
  try {
    const create = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        companyId,
      },
    });

    return res
      .status(200)
      .json({ message: "Produto cadastrado com sucesso!", create });
  } catch (err) {
    return res.status(400).json({ err: "Erro ao cadastrar produto." });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const produtos = await prisma.product.findMany();
    if (produtos.length >= 1) {
      res.status(200).json(produtos);
    }
  } catch (err) {
    res.status(400).json({ message: err });
  }
};

export const getProdsCompany = async (req, res) => {
  const companyId = Number(req.params.companyId);

  try {
    const prod = await prisma.product.findMany({
      where: {
        companyId: companyId,
      },
    });
    if (prod.length >= 1) {
      res.status(200).json(prod);
    } else {
      res.status(400).json({ message: "Não há produtos em estoque" });
    }
  } catch (err) {
    res.status(400).json({ message: err });
  }
};

export const getOneProdCompany = async (req, res) => {
  const idProduct = Number(req.params.productId);
  const companyId = Number(req.params.companyId);

  try {
    const oneProd = await prisma.product.findMany({
      where: {
        id: idProduct,
        companyId: companyId,
      },
    });

    if (oneProd.length == 0) {
      res.status(400).json({ message: "Nenhum produto encontrado" });
    } else {
      res.status(200).json(oneProd);
    }
  } catch (err) {
    res.status(400).json({ message: err });
  }
};

export const deleteProd = async (req, res) => {
  const companyId = Number(req.params.companyId);
  const idProduct = Number(req.params.productId);
  const companyExists = await prisma.company.findMany({
    where: {
      id: companyId,
    },
  });
  const productExists = await prisma.product.findMany({
    where: {
      id: idProduct,
    },
  });
  if (companyExists.length == 0) {
    return res.status(400).json({ message: "Empresa não existe" });
  }

  if (productExists.length == 0) {
    return res.status(400).json({ message: "Produto não existe!" });
  }

  try {
    const deleteProd = await prisma.product.delete({
      where: {
        companyId: companyId,
        id: idProduct,
      },
    });

    if ((deleteProd == null) | !deleteProd) {
      res.status(200).json({ message: "Erro ao deletar o Produto" });
    } else {
      res.status(200).json({ message: "Produto Deletado", deleteProd });
    }
  } catch (err) {
    res.status(400).json(err);
  }
};
