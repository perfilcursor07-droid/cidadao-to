import { Router } from 'express';
import { list, getById, getPromises, getVotes, getRatings, syncFromAPIs, listByRole } from '../controllers/politician.controller';

const router = Router();

router.get('/', list);
router.get('/by-role', listByRole);
router.post('/sync', syncFromAPIs);
router.get('/:id', getById);
router.get('/:id/promises', getPromises);
router.get('/:id/votes', getVotes);
router.get('/:id/ratings', getRatings);

export default router;
