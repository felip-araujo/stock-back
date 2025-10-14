import express from "express";
import {
  createDepartment,
  getDepartmentsByCompany,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";

const router = express.Router();

// Criar departamento
router.post("/", createDepartment);

// Listar departamentos de uma empresa
router.get("/company/:companyId", getDepartmentsByCompany);

// Atualizar departamento
router.put("/:id", updateDepartment);

// Deletar departamento
router.delete("/:id", deleteDepartment);

export default router;
