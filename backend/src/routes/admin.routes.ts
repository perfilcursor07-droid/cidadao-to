import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';
import {
  getStats, listUsers, listDiarios, fetchDiario, deleteDiario,
  syncPoliticians, resetPoliticians, updatePolitician,
  researchPromises, researchAllPromisesEndpoint, updatePromisesStatusEndpoint,
  resetPromises,
  listNepotismAlerts, analyzeNepotism, analyzeAllNepotismEndpoint, deleteNepotismAlert
} from '../controllers/admin.controller';
import { listAllPolls, createPoll, updatePoll, deletePoll } from '../controllers/poll.controller';

const router = Router();

router.use(authMiddleware, requireRole('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.get('/diario', listDiarios);
router.post('/diario/fetch', fetchDiario);
router.delete('/diario/:id', deleteDiario);
router.post('/politicians/sync', syncPoliticians);
router.post('/politicians/reset', resetPoliticians);
router.put('/politicians/:id', updatePolitician);
router.post('/promises/research/:id', researchPromises);
router.post('/promises/research-all', researchAllPromisesEndpoint);
router.post('/promises/update-status', updatePromisesStatusEndpoint);
router.post('/promises/reset', resetPromises);
router.get('/nepotism', listNepotismAlerts);
router.post('/nepotism/analyze/:id', analyzeNepotism);
router.post('/nepotism/analyze-all', analyzeAllNepotismEndpoint);
router.delete('/nepotism/:id', deleteNepotismAlert);
router.get('/polls', listAllPolls);
router.post('/polls', createPoll);
router.put('/polls/:id', updatePoll);
router.delete('/polls/:id', deletePoll);

export default router;
