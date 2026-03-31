import { Router } from 'express';
import { listPolls, getPoll, votePoll, myVote } from '../controllers/poll.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', listPolls);
router.get('/:id', getPoll);
router.post('/:id/vote', authMiddleware, votePoll);
router.get('/:id/my-vote', authMiddleware, myVote);

export default router;
