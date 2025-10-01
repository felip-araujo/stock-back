import express from "express";
import {
  createUser,
  deleteUsers,
  getUsers,
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
 *         description: Pega Todos os Usuários(Apenas SUPER_ADMIN)
 */
router.get("/", authMiddleware, authorize(["SUPER_ADMIN"]), getUsers);
/**
 * @swagger
 * /user:
 *   post:
 *     summary: Criação de Usuarios
 *     tags: [user]
 *     responses:
 *       200:
 *         description: Cria novos usuarios
 */
router.post("/", createUser);
router.delete("/:id", authMiddleware, authorize(["SUPER_ADMIN"]), deleteUsers);

export default router;
