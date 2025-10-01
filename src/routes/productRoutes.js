import express from "express";
import {
  getAllProducts,
  getProdsCompany,
  addProduct,
  deleteProd,
  getOneProdCompany,
} from "../controllers/productController.js";
import { authMiddleware } from "../middleware/auth.Middleware.js";
import { authorize } from "../middleware/authorize.Middleware.js";

const router = express.Router();

router.post("/", authMiddleware, authorize(["COMPANY_ADMIN"]), addProduct);
router.get("/", authMiddleware, authorize(["COMPANY_ADMIN"]), getAllProducts);
router.get("/:companyId", getProdsCompany);
router.get("/:companyId/:productId", getOneProdCompany);
router.delete("/:companyId/:productId", deleteProd);

export default router;
