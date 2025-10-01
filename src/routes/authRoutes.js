import express from "express";
import { login } from "../controllers/authControllers.js";
const router = express.Router();


/**
 * @swagger
 * /auth:
 *   post:
 *     summary: Rota de Autenticação
 *     tags: [auth]
 *     responses:
 *       200:
 *         description: Faz a autenticação de login e retorna o código JWT
 */
router.post("/", login);

export default router;
