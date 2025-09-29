import express from 'express';
import { getCompanies, createCompany } from '../controllers/companiesControllers.js';

const router = express.Router();

router.get('/', getCompanies);
router.post('/', createCompany);

export default router;
