import express from "express";
import {
  createUser,
  deleteUsers,
  getUsers,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.Middleware.js";
import { authorize } from "../middleware/authorize.Middleware.js";
const router = express.Router();

router.get("/", authMiddleware, authorize(["SUPER_ADMIN"]), getUsers);
router.post("/", createUser);
router.delete("/:id", authMiddleware, authorize(["SUPER_ADMIN"]), deleteUsers);

export default router;
