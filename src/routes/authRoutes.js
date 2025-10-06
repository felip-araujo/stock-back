import express from "express";
import { login, requestPasswordRecovery, resetPassword } from "../controllers/authControllers.js";

const router = express.Router();

/**
 * @swagger
 * /auth:
 *   post:
 *     summary: Rota de Autenticação
 *     tags: [auth]
 *     links: https://stock-back-vert.vercel.app/auth
 *     responses:
 *       200:
 *         description: Faz a autenticação de login e retorna o código JWT | login por meio de "email", "password"
 */
router.post("/", login);

router.post("/recover-password", requestPasswordRecovery);
router.post("/reset-password/:token", resetPassword);
export default router;
