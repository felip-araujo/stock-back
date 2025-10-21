import express from "express";
import { addSale, getSalesDetail, totalSalesValue, totalSalesValueForUser } from "../controllers/saleControllers.js";
import { authMiddleware } from "../middleware/auth.Middleware.js";
import { authorize } from "../middleware/authorize.Middleware.js";
import { paginate } from "../middleware/paginate.Middeware.js";
const router = express.Router();

router.post("/:companyId", authMiddleware, authorize(["COMPANY_ADMIN", "EMPLOYEE"]), addSale);
router.get("/:companyId", paginate, authMiddleware, authorize(["COMPANY_ADMIN", "EMPLOYEE"]), getSalesDetail);
router.get("/total/:companyId", authMiddleware, authorize(["COMPANY_ADMIN", "EMPLOYEE"]), totalSalesValue);
router.get("/total/user/:companyId/:userId", authMiddleware, authorize(["COMPANY_ADMIN", "EMPLOYEE"]), totalSalesValueForUser);

export default router;
  