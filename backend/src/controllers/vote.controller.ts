import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware';
import Vote from '../models/Vote';

const voteSchema = z.object({
  politician_id: z.number().int().positive(),
  type: z.enum(['approve', 'disapprove']),
});

export async function create(req: AuthRequest, res: Response) {
  const data = voteSchema.parse(req.body);
  const userId = req.user!.id;

  const existing = await Vote.findOne({ where: { user_id: userId, politician_id: data.politician_id } });
  if (existing) return res.status(409).json({ error: 'Você já votou neste político', code: 'ALREADY_VOTED' });

  const vote = await Vote.create({ user_id: userId, politician_id: data.politician_id, type: data.type });
  res.status(201).json(vote);
}

export async function update(req: AuthRequest, res: Response) {
  const vote = await Vote.findByPk(req.params.id);
  if (!vote) return res.status(404).json({ error: 'Voto não encontrado', code: 'NOT_FOUND' });
  if (vote.user_id !== req.user!.id) return res.status(403).json({ error: 'Acesso negado', code: 'FORBIDDEN' });

  const { type } = z.object({ type: z.enum(['approve', 'disapprove']) }).parse(req.body);
  await vote.update({ type });
  res.json(vote);
}

export async function remove(req: AuthRequest, res: Response) {
  const vote = await Vote.findByPk(req.params.id);
  if (!vote) return res.status(404).json({ error: 'Voto não encontrado', code: 'NOT_FOUND' });
  if (vote.user_id !== req.user!.id) return res.status(403).json({ error: 'Acesso negado', code: 'FORBIDDEN' });

  await vote.destroy();
  res.json({ message: 'Voto removido' });
}
