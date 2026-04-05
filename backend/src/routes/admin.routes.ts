import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';
import {
  getStats, listUsers, listDiarios, fetchDiario, deleteDiario, fetchDiarioBulk,
  syncPoliticians, resetPoliticians, updatePolitician, fetchPhotos, fetchPhotosSync, searchPhoto,
  researchPromises, researchAllPromisesEndpoint, updatePromisesStatusEndpoint,
  resetPromises
} from '../controllers/admin.controller';
import { listAllPolls, createPoll, updatePoll, deletePoll } from '../controllers/poll.controller';
import { syncExpenses } from '../controllers/expense.controller';

const router = Router();

router.use(authMiddleware, requireRole('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.get('/diario', listDiarios);
router.post('/diario/fetch', fetchDiario);
router.post('/diario/fetch-bulk', fetchDiarioBulk);
router.delete('/diario/:id', deleteDiario);
router.post('/politicians/sync', syncPoliticians);
router.post('/politicians/photos', fetchPhotos);
router.post('/politicians/photos/sync', fetchPhotosSync);
router.post('/politicians/photos/search', searchPhoto);
router.post('/politicians/reset', resetPoliticians);
router.put('/politicians/:id', updatePolitician);
router.post('/promises/research/:id', researchPromises);
router.post('/promises/research-all', researchAllPromisesEndpoint);
router.post('/promises/update-status', updatePromisesStatusEndpoint);
router.post('/promises/reset', resetPromises);
router.get('/polls', listAllPolls);
router.post('/polls', createPoll);
router.put('/polls/:id', updatePoll);
router.delete('/polls/:id', deletePoll);
router.post('/expenses/sync', syncExpenses);

export default router;
