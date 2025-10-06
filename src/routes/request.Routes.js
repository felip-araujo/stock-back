import express from "express";
import { criarRequisicao } from "../controllers/requestController.js";

const router = express.Router();

router.post("/:companyId", criarRequisicao);

export default router;
