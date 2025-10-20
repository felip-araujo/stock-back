import { json } from "express";
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
    const produtos = await prisma.product.findMany({
      skip: req.pagination.skip,
      take: req.pagination.take,
    });

    const total = await prisma.product.count();

    res.status(200).json({
      data: produtos,
      pagination: {
        total,
        page: req.pagination.page,
        limit: req.pagination.limit,
        totalPages: Math.ceil(total / req.pagination.limit),
      },
    });
  } catch (err) {
    res.status(400).json({ message: err });
  }
};

export const getProdsCompany = async (req, res) => {
  const companyId = Number(req.params.companyId);

  try {
    // Buscar produtos com paginação
    const prod = await prisma.product.findMany({
      where: { companyId },
      skip: req.pagination.skip,
      take: req.pagination.take,
    });

    // Contar total de produtos (sem limite)
    const total = await prisma.product.count({
      where: { companyId },
    });
    // Retornar produtos + paginação
    res.status(200).json({
      data: prod,
      pagination: {
        total,
        page: req.pagination.page,
        limit: req.pagination.limit,
        totalPages: Math.ceil(total / req.pagination.limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const editProd = async (req, res) => {
  const companyId = Number(req.params.companyId);
  const productId = Number(req.params.prodId);

  const { stock, name, description, price } = req.body;

  if (!companyId) {
    return res.status(400).json({ message: "Id da empresa é obrigatório!" });
  }

  const prodExists = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!prodExists) {
    return res.status(404).json({ message: "O Produto não existe!" });
  }

  // Construir o objeto data dinamicamente com apenas os campos fornecidos
  const data = {};
  if (stock !== undefined) data.stock = Number(stock);
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (price !== undefined) data.price = Number(price);

  // Verificar se pelo menos um campo foi fornecido
  if (Object.keys(data).length === 0) {
    return res
      .status(400)
      .json({ message: "Pelo menos um campo deve ser fornecido para edição." });
  }

  try {
    const editar = await prisma.product.update({
      where: {
        id: productId,
      },
      data,
    });

    res.status(200).json({ message: "Produto editado com sucesso", editar });
  } catch (err) {
    res.status(400).json({ message: "Erro na requisição", err });
    console.error(err);
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

export const totalPriceProd = async (req, res) => {
  const companyId = Number(req.params.companyId);

  try {
    const products = await prisma.product.findMany({
      where: {
        companyId: companyId,
      },
      select: { price: true, stock: true },
    });

    const totalPrice = products.reduce(
      (acc, item) => acc + item.price * item.stock,
      0
    );

    res.json({ totalPrice });
  } catch (err) {
    res.status(400).json(err);
  }
};
