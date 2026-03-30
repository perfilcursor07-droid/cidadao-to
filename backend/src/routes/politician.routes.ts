import { Router } from 'express';
import { list, getById, getPromises, getVotes, getRatings } from '../controllers/politician.controller';

const router = Router();

router.get('/', list);
router.get('/:id', getById);
router.get('/:id/promises', getPromises);
router.get('/:id/votes', getVotes);
router.get('/:id/ratings', getRatings);

export default router;
