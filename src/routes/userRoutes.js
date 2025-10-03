import express from "express";
import {
  createUser,
  deleteUsers,
  getUsers,
  updateUsers,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.Middleware.js";
import { authorize } from "../middleware/authorize.Middleware.js";
const router = express.Router();
/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get Usuarios
 *     tags: [user]
 *     responses:
 *       200:
 *         description: Retorna todos os usuários, precisa estar autenticado como ["SUPER_ADMIN"]
 */
router.get("/:companyId", authMiddleware, authorize(["SUPER_ADMIN", "COMPANY_ADMIN"]), getUsers);
/**
 * @swagger
 * /user:
 *   post:
 *     summary: Criação de Usuarios
 *     tags: [user]
 *     responses:
 *       200:
 *         description: Cria novos usuários, precisa estar autenticado como ("SUPER_ADMIN")
 */
router.post("/", authMiddleware, authorize(["SUPER_ADMIN", "COMPANY_ADMIN"]), createUser);
/**
 * @swagger
 * /user:
 *   delete:
 *     summary: Exclusão de Usuários
 *     tags: [user]
 *     responses:
 *       200:
 *         description: Deleta usuários, precisa passaro o ID do usuario via params, precisa estar autenticado como ("SUPER_ADMIN")
 */
router.delete("/:companyId/:id", authMiddleware, authorize(["SUPER_ADMIN", "COMPANY_ADMIN"]), deleteUsers);

router.put("/:companyId/:id", authMiddleware,  authorize(["SUPER_ADMIN", "COMPANY_ADMIN"]),  updateUsers)

export default router;
