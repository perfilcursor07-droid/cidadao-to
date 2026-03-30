import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';
import { getStats, listUsers, listDiarios, fetchDiario, deleteDiario, syncPoliticians } from '../controllers/admin.controller';

const router = Router();

// Todas as rotas admin requerem autenticação + role admin
router.use(authMiddleware, requireRole('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.get('/diario', listDiarios);
router.post('/diario/fetch', fetchDiario);
router.delete('/diario/:id', deleteDiario);
router.post('/politicians/sync', syncPoliticians);

export default router;
