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
router.get("/:name", getCompany);
router.post("/", createCompany);
router.put("/:name", updateCompany);
router.delete("/:id", deleteCompany);

export default router;
