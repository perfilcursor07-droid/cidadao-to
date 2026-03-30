import { Router } from 'express';
import { analyze, listAnalyses, getAnalysis } from '../controllers/diario.controller';

const router = Router();

router.post('/analyze', analyze);
router.get('/analyses', listAnalyses);
router.get('/analyses/:id', getAnalysis);

export default router;
