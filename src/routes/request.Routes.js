import express from "express";
import { criarRequisicao, excludeRequisicoes, verRequisicoes } from "../controllers/requestController.js";
import { paginate } from "../middleware/paginate.Middeware.js";
import { authMiddleware } from "../middleware/auth.Middleware.js";
import { authorize } from "../middleware/authorize.Middleware.js";

const router = express.Router();

router.post("/:companyId", authMiddleware, authorize(["COMPANY_ADMIN", "EMPLOYEE"]), criarRequisicao);
router.get("/:companyId", authMiddleware, authorize(["COMPANY_ADMIN"]), paginate, verRequisicoes);
router.delete("/:companyId/:idRequisicao", authMiddleware, authorize(["COMPANY_ADMIN"]), excludeRequisicoes);

export default router;
