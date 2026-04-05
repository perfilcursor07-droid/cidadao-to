import { Router } from 'express';
import { searchSalaries, getSalariesByPolitician, getAllVereadoresSalaries } from '../controllers/salary.controller';

const router = Router();

// Rotas públicas — dados de transparência
router.get('/search', searchSalaries);
router.get('/vereador/:id', getSalariesByPolitician);
router.get('/vereadores', getAllVereadoresSalaries);

export default router;
