import express from "express";
import { criarRequisicao, excludeRequisicoes, gerenciarRequisicoes, verRequisicaoPorUsuario, verRequisicoes } from "../controllers/requestController.js";
import { paginate } from "../middleware/paginate.Middeware.js";
import { authMiddleware } from "../middleware/auth.Middleware.js";
import { authorize } from "../middleware/authorize.Middleware.js";

const router = express.Router();

router.post("/:companyId", authMiddleware, authorize(["COMPANY_ADMIN", "EMPLOYEE"]), criarRequisicao);
router.get("/:companyId", authMiddleware, authorize(["COMPANY_ADMIN"]), paginate, verRequisicoes);
router.get("/:companyId/:idUsuario", authMiddleware, authorize(["COMPANY_ADMIN", "EMPLOYEE"]), paginate,  verRequisicaoPorUsuario)
router.delete("/:companyId/:idRequisicao", authMiddleware, authorize(["COMPANY_ADMIN"]), excludeRequisicoes);
router.put("/:companyId/:idRequisicao", gerenciarRequisicoes)

export default router;
