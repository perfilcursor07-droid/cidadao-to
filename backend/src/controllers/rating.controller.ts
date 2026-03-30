import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware';
import Rating from '../models/Rating';

const ratingSchema = z.object({
  politician_id: z.number().int().positive(),
  attendance: z.number().int().min(1).max(5),
  project_quality: z.number().int().min(1).max(5),
  transparency: z.number().int().min(1).max(5),
  communication: z.number().int().min(1).max(5),
});

export async function create(req: AuthRequest, res: Response) {
  const data = ratingSchema.parse(req.body);
  const userId = req.user!.id;

  const existing = await Rating.findOne({ where: { user_id: userId, politician_id: data.politician_id } });
  if (existing) return res.status(409).json({ error: 'Você já avaliou este político', code: 'ALREADY_RATED' });

  const average = (data.attendance + data.project_quality + data.transparency + data.communication) / 4;
  const rating = await Rating.create({ ...data, user_id: userId, average: parseFloat(average.toFixed(2)) });
  res.status(201).json(rating);
}

export async function update(req: AuthRequest, res: Response) {
  const rating = await Rating.findByPk(req.params.id);
  if (!rating) return res.status(404).json({ error: 'Avaliação não encontrada', code: 'NOT_FOUND' });
  if (rating.user_id !== req.user!.id) return res.status(403).json({ error: 'Acesso negado', code: 'FORBIDDEN' });

  const data = ratingSchema.omit({ politician_id: true }).parse(req.body);
  const average = (data.attendance + data.project_quality + data.transparency + data.communication) / 4;
  await rating.update({ ...data, average: parseFloat(average.toFixed(2)) });
  res.json(rating);
}
