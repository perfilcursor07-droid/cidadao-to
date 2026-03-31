import { Request, Response } from 'express';
import { z } from 'zod';
import PromiseModel from '../models/Promise';

const promiseSchema = z.object({
  politician_id: z.number().int().positive(),
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  area: z.string().max(100).optional(),
  status: z.enum(['pending', 'progress', 'done', 'failed']).optional(),
  progress_pct: z.number().int().min(0).max(100).optional(),
  source_url: z.string().url().optional(),
  deadline: z.string().transform(v => v ? new Date(v) : undefined).optional(),
});

export async function list(req: Request, res: Response) {
  const where: any = {};
  if (req.query.politician_id) where.politician_id = req.query.politician_id;
  if (req.query.status) where.status = req.query.status;
  if (req.query.area) where.area = req.query.area;

  const promises = await PromiseModel.findAll({ where, include: ['politician'] });
  res.json(promises);
}

export async function getById(req: Request, res: Response) {
  const promise = await PromiseModel.findByPk(req.params.id, { include: ['politician'] });
  if (!promise) return res.status(404).json({ error: 'Promessa não encontrada', code: 'NOT_FOUND' });
  res.json(promise);
}

export async function create(req: Request, res: Response) {
  const data = promiseSchema.parse(req.body);
  const promise = await PromiseModel.create(data);
  res.status(201).json(promise);
}

export async function update(req: Request, res: Response) {
  const promise = await PromiseModel.findByPk(req.params.id);
  if (!promise) return res.status(404).json({ error: 'Promessa não encontrada', code: 'NOT_FOUND' });

  const data = promiseSchema.partial().parse(req.body);
  await promise.update(data);
  res.json(promise);
}

export async function remove(req: Request, res: Response) {
  const promise = await PromiseModel.findByPk(req.params.id);
  if (!promise) return res.status(404).json({ error: 'Promessa não encontrada', code: 'NOT_FOUND' });
  await promise.destroy();
  res.json({ message: 'Promessa removida' });
}
