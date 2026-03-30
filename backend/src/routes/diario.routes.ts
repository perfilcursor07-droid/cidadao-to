import { Router } from 'express';
import { analyze, listAnalyses, getAnalysis, triggerFetch, triggerFetchSync } from '../controllers/diario.controller';

const router = Router();

// Análise manual de texto via streaming
router.post('/analyze', analyze);

// Download automático do Diário Oficial (body: { date?: "YYYY-MM-DD" })
router.post('/fetch', triggerFetch);          // async — resposta imediata
router.post('/fetch/sync', triggerFetchSync); // sync — aguarda resultado (para testes)

// Histórico de análises
router.get('/analyses', listAnalyses);
router.get('/analyses/:id', getAnalysis);

export default router;
