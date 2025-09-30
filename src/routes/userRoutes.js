import express from "express";
import { createUser, deleteUsers, getUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/", getUsers);
router.post("/", createUser);
router.delete("/:id", deleteUsers);

export default router;
