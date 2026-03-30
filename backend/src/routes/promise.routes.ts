import { Router } from 'express';
import { list, getById, create, update } from '../controllers/promise.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', list);
router.get('/:id', getById);
router.post('/', authMiddleware, requireRole('admin'), create);
router.put('/:id', authMiddleware, requireRole('admin'), update);

export default router;
