import { Router } from 'express';
import { create, update } from '../controllers/rating.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, create);
router.put('/:id', authMiddleware, update);

export default router;
