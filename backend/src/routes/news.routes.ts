import { Router } from 'express';
import { list, getById, create, update } from '../controllers/news.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', list);
router.get('/:id', getById);
router.post('/', authMiddleware, requireRole('editor', 'admin'), create);
router.put('/:id', authMiddleware, requireRole('editor', 'admin'), update);

export default router;
