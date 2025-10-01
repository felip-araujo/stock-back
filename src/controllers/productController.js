import prisma from "../services/prismaClient.js";

export const addProduct = async (req, res) => {
  try {
    const create = await prisma.product.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        stock: req.body.stock,
        companyId: req.body.companyId,
      },
    });
    res.status(200).json(create);
  } catch (err) {
    res.status(400).json({ err: "erro" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    req.status(200).json(products);
  } catch (err) {
    res.status(400).json(err)
  }
};
