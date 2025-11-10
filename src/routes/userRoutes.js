import express from "express";
import {
  alterarSenha,
  createSuperUser,
  createUser,
  deleteUsers,
  deleteUsersForId,
  getAllUsers,
  getUsers,
  updateUsers,
  verMeusDados,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.Middleware.js";
import { authorize } from "../middleware/authorize.Middleware.js";
import { paginate } from "../middleware/paginate.Middeware.js";
import { searchMiddleware } from "../middleware/searchMiddleware.js"

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

router.get("/", getAllUsers)
router.get("/:companyId", authMiddleware, paginate, authorize(["SUPER_ADMIN", "COMPANY_ADMIN"]), getUsers);
router.get("/:companyId/:userId", verMeusDados)
router.get("/busca/:companyId/search", searchMiddleware)

router.post("/su", createSuperUser)


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
router.delete("/:id", deleteUsersForId)

router.put("/:companyId/:id", authMiddleware, authorize(["SUPER_ADMIN", "COMPANY_ADMIN", "EMPLOYEE"]), updateUsers)
router.put("/alterar-senha/:companyId/:id", alterarSenha)

export default router;
