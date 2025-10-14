import express from "express";
import {
  getAllProducts,
  getProdsCompany,
  addProduct,
  deleteProd,
  getOneProdCompany,
  editProd,
} from "../controllers/productController.js";
import { authMiddleware } from "../middleware/auth.Middleware.js";
import { authorize } from "../middleware/authorize.Middleware.js";
import { paginate } from "../middleware/paginate.Middeware.js";


const router = express.Router();
/**
 * @swagger
 * /product:
 *   post:
 *     summary: Cria um produto para empresa
 *     tags: [product]
 *     responses:
 *       200:
 *         description: Cria novo produto no "estoque", precisa estar autenticado como ["COMPANY_ADMIN"]
 */
router.post("/", authMiddleware, authorize(["COMPANY_ADMIN"]), addProduct);
/**
 * @swagger
 * /product:
 *   get:
 *     summary: Retorna todos os produtos
 *     tags: [product]
 *     responses:
 *       200:
 *         description: Retorna todos os produtos cadastrados no estoque, precisa estar autenticado como ["SUPER_ADMIN"]
 */
router.get("/", authMiddleware, paginate, authorize(["SUPER_ADMIN"]), getAllProducts);
/**
 * @swagger
 * /product/companyId:
 *   get:
 *     summary: Retorna todos os produtos de uma empresa
 *     tags: [product]
 *     responses:
 *       200:
 *         description: Retorna todos os produtos cadastrados no estoque da empresa, precisa informar o companyId(id) via params da empresa selecionada precisa estar autenticado como ["COMPANY_ADMIN"]
 */
router.get("/:companyId", authMiddleware, paginate, authorize(["COMPANY_ADMIN", "SUPER_ADMIN", "EMPLOYEE"]),getProdsCompany);
/**
 * @swagger
 * /product/companyId/productId:
 *    get:
 *     summary: Retorna um único produto de uma empresa
 *     tags: [product]
 *     responses:
 *       200:
 *         description: Retorna um produto cadastrado no estoque da empresa, precisa informar o companyId(id) e productId via params da empresa selecionada, precisa estar autenticado como ["COMPANY_ADMIN"]
 */
router.get("/:companyId/:productId", authMiddleware, authorize(["COMPANY_ADMIN"]), getOneProdCompany);
/**
 * @swagger
 * /product/companyId/productId:
 *    delete:
 *     summary: Deleta um produto de uma empresa
 *     tags: [product]
 *     responses:
 *       200:
 *         description: Deleta um produto cadastrado no estoque da empresa, precisa informar o companyId(id) e productId via params da empresa selecionada, precisa estar autenticado como ["COMPANY_ADMIN"]
 */
router.delete("/:companyId/:productId", authMiddleware, authorize(["COMPANY_ADMIN"]),deleteProd);

router.put("/:companyId/:prodId", editProd)

export default router;
