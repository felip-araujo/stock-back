import express from "express";
import { dashStats } from "../controllers/statsDashCompany.js";
import { authMiddleware } from "../middleware/auth.Middleware.js";
import { authorize } from "../middleware/authorize.Middleware.js";

const router = express.Router();

router.get("/:companyId", authMiddleware, authorize(["COMPANY_ADMIN", "SUPER_ADMIN"]),  dashStats);

export default router;
