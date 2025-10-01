import express from "express";
import {
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../controllers/companiesControllers.js";
import { authMiddleware } from "../middleware/auth.Middleware.js";
import { authorize } from "../middleware/authorize.Middleware.js";

const router = express.Router();

router.get("/", authMiddleware, authorize(["SUPER_ADMIN"]), getCompany);
router.get("/:name", authMiddleware, authorize(["SUPER_ADMIN"]),  getCompany);
router.post("/", createCompany);
router.put("/:name", authMiddleware, authorize(["SUPER_ADMIN"]), updateCompany);
router.delete("/:id", authMiddleware, authorize(["SUPER_ADMIN"]), deleteCompany);

export default router;
