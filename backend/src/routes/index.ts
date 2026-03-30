import { Router } from 'express';
import authRoutes from './auth.routes';
import politicianRoutes from './politician.routes';
import promiseRoutes from './promise.routes';
import voteRoutes from './vote.routes';
import ratingRoutes from './rating.routes';
import newsRoutes from './news.routes';
import diarioRoutes from './diario.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/politicians', politicianRoutes);
router.use('/promises', promiseRoutes);
router.use('/votes', voteRoutes);
router.use('/ratings', ratingRoutes);
router.use('/news', newsRoutes);
router.use('/diario', diarioRoutes);

export default router;
