import express from "express";
import { createMaterial, deleteMaterial, editarMaterial, verMaterial, verMaterialUnico } from "../controllers/materialControllers.js";
import { paginate } from "../middleware/paginate.Middeware.js";
import { authMiddleware } from "../middleware/auth.Middleware.js";
import { authorize } from "../middleware/authorize.Middleware.js";

const router = express.Router();

router.post("/", authMiddleware, authorize(["COMPANY_ADMIN"]), createMaterial);
router.get("/:companyId", paginate, authMiddleware, authorize(["COMPANY_ADMIN", "EMPLOYEE"]), verMaterial);
router.get("/:companyId/:materialId", authMiddleware, authorize(["COMPANY_ADMIN", "EMPLOYEE"]), verMaterialUnico);
router.delete("/:companyId/:materialId", authMiddleware, authorize(["COMPANY_ADMIN"]), deleteMaterial);
router.put("/:companyId/:materialId", authMiddleware, authorize(["COMPANY_ADMIN"]), editarMaterial);

export default router;
