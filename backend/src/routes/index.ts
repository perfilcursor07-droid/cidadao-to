import { Router } from 'express';
import authRoutes from './auth.routes';
import politicianRoutes from './politician.routes';
import promiseRoutes from './promise.routes';
import voteRoutes from './vote.routes';
import ratingRoutes from './rating.routes';
import newsRoutes from './news.routes';
import diarioRoutes from './diario.routes';
import adminRoutes from './admin.routes';
import pollRoutes from './poll.routes';
import expenseRoutes from './expense.routes';
import nepotismRoutes from './nepotism.routes';
import salaryRoutes from './salary.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/politicians', politicianRoutes);
router.use('/promises', promiseRoutes);
router.use('/votes', voteRoutes);
router.use('/ratings', ratingRoutes);
router.use('/news', newsRoutes);
router.use('/diario', diarioRoutes);
router.use('/polls', pollRoutes);
router.use('/expenses', expenseRoutes);
router.use('/nepotism', nepotismRoutes);
router.use('/salaries', salaryRoutes);
router.use('/admin', adminRoutes);

export default router;
