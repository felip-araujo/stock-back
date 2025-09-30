import express from 'express';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../controllers/companiesControllers.js';

const router = express.Router();

router.get('/', getCompanies);
router.get('/:name', getCompanies);
router.post('/', createCompany);
router.put('/:name', updateCompany)
router.delete('/:id', deleteCompany)

export default router;
