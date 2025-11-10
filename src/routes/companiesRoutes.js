import express from "express";
import {
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../controllers/companiesControllers.js";
import { authMiddleware } from "../middleware/auth.Middleware.js";
import { authorize } from "../middleware/authorize.Middleware.js";
import { paginate } from "../middleware/paginate.Middeware.js";

const router = express.Router();
/**
 * @swagger
 * /companies:
 *    get:
 *     summary: Retorna todas as empresas cadastradas
 *     tags: [companies]
 *     responses:
 *       200:
 *         description: Retorna todas as empresas cadastradas, precisa estar autenticado como ["SUPER_ADMIN"]
 */
router.get("/", authMiddleware, paginate, authorize(["COMPANY_ADMIN", "SUPER_ADMIN"]), getCompany);
/**
 * @swagger
 * /companies/name:
 *    get:
 *     summary: Retorna uma empresa pelo nome
 *     tags: [companies]
 *     responses:
 *       200:
 *         description: Retorna retorna uma empresa pelo nome, precisa passar o nome via params, precisa estar autenticado como ["SUPER_ADMIN"]
 */
router.get("/:name", authMiddleware, authorize(["SUPER_ADMIN"]), getCompany);
/**
 * @swagger
 * /companies:
 *    post:
 *     summary: Cadastra uma nova empresa | Cria novo usuario do tipo ("COMPANY_ADMIN")
 *     tags: [companies]
 *     responses:
 *       200:
 *         description: Cadastra uma nova empresa e cria um novo usuario admin pra essa empresa ("COMPANY_ADMIN")
 */
router.post("/", createCompany);
/**
 * @swagger
 * /companies/name:
 *    put:
 *     summary: Edita os dados de uma empresa
 *     tags: [companies]
 *     responses:
 *       200:
 *         description: Edita os dados de uma empresa, precisa passar o nome(name) da empresa via params, precisa estar autenticado como ["SUPER_ADMIN"]
 */
router.put("/:name", authMiddleware, authorize(["SUPER_ADMIN", "COMPANY_ADMIN"]), updateCompany);
/**
 * @swagger
 * /companies/id:
 *    delete:
 *     summary: Deleta uma empresa
 *     tags: [companies]
 *     responses:
 *       200:
 *         description: Deleta uma empresa, precisa passar o id da empresa via params, precisa estar autenticado como ["SUPER_ADMIN"]
 */

router.delete(
  "/:id",
  authMiddleware,
  authorize(["SUPER_ADMIN"]),
  deleteCompany
);

export default router;
