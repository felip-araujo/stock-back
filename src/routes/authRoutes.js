import express from "express";
import { auth } from "../controllers/authControllers.js";
const router = express.Router();

router.post("/", auth);

export default router;
