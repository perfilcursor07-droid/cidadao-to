import { Router } from 'express';
import { getPoliticianExpenses, getExpensesRanking, getExpensesSummary } from '../controllers/expense.controller';

const router = Router();

router.get('/politician/:id', getPoliticianExpenses);
router.get('/ranking', getExpensesRanking);
router.get('/summary', getExpensesSummary);

export default router;
