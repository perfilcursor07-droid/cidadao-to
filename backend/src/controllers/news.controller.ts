import { Request, Response } from 'express';
import { z } from 'zod';
import News from '../models/News';

const newsSchema = z.object({
  title: z.string().min(3).max(255),
  summary: z.string().optional(),
  content: z.string().optional(),
  category: z.string().max(80).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  cover_emoji: z.string().max(10).optional(),
  cover_color: z.string().max(20).optional(),
});

export async function list(req: Request, res: Response) {
  const where: any = {};
  if (req.query.category) where.category = req.query.category;
  if (req.query.featured) where.featured = req.query.featured === 'true';
  if (req.query.published !== undefined) where.published = req.query.published === 'true';
  else where.published = true;

  const news = await News.findAll({ where, order: [['published_at', 'DESC']], include: ['author'] });
  res.json(news);
}

export async function getById(req: Request, res: Response) {
  const article = await News.findByPk(req.params.id, { include: ['author'] });
  if (!article) return res.status(404).json({ error: 'Notícia não encontrada', code: 'NOT_FOUND' });
  res.json(article);
}

export async function create(req: Request & { user?: any }, res: Response) {
  const data = newsSchema.parse(req.body);
  const article = await News.create({
    ...data,
    author_id: req.user?.id,
    published_at: data.published ? new Date() : null,
  });
  res.status(201).json(article);
}

export async function update(req: Request, res: Response) {
  const article = await News.findByPk(req.params.id);
  if (!article) return res.status(404).json({ error: 'Notícia não encontrada', code: 'NOT_FOUND' });

  const data = newsSchema.partial().parse(req.body);
  if (data.published && !article.published_at) (data as any).published_at = new Date();
  await article.update(data);
  res.json(article);
}
