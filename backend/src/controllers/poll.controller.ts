import { Request, Response } from 'express';
import { z } from 'zod';
import { fn, col } from 'sequelize';
import { Poll, PollVote } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';

// GET /api/polls — lista enquetes ativas com contagem de votos
export async function listPolls(req: Request, res: Response) {
  const polls = await Poll.findAll({
    where: { active: true },
    order: [['created_at', 'DESC']],
  });

  const result = [];
  for (const poll of polls) {
    const voteCounts = await PollVote.findAll({
      where: { poll_id: poll.id },
      attributes: ['option_index', [fn('COUNT', col('id')), 'count']],
      group: ['option_index'],
      raw: true,
    }) as any[];

    const totalVotes = voteCounts.reduce((s: number, v: any) => s + Number(v.count), 0);
    const options = (poll.options || []).map((text: string, i: number) => {
      const vc = voteCounts.find((v: any) => v.option_index === i);
      const count = Number(vc?.count || 0);
      return { text, votes: count, pct: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0 };
    });

    result.push({ ...poll.toJSON(), options, totalVotes });
  }

  res.json(result);
}

// GET /api/polls/:id
export async function getPoll(req: Request, res: Response) {
  const poll = await Poll.findByPk(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Enquete não encontrada' });

  const voteCounts = await PollVote.findAll({
    where: { poll_id: poll.id },
    attributes: ['option_index', [fn('COUNT', col('id')), 'count']],
    group: ['option_index'],
    raw: true,
  }) as any[];

  const totalVotes = voteCounts.reduce((s: number, v: any) => s + Number(v.count), 0);
  const options = (poll.options || []).map((text: string, i: number) => {
    const vc = voteCounts.find((v: any) => v.option_index === i);
    const count = Number(vc?.count || 0);
    return { text, votes: count, pct: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0 };
  });

  res.json({ ...poll.toJSON(), options, totalVotes });
}

// POST /api/polls/:id/vote — vota numa enquete
export async function votePoll(req: AuthRequest, res: Response) {
  const poll = await Poll.findByPk(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Enquete não encontrada' });
  if (!poll.active) return res.status(400).json({ error: 'Enquete encerrada' });
  if (poll.ends_at && new Date(poll.ends_at) < new Date()) return res.status(400).json({ error: 'Enquete expirada' });

  const { option_index } = z.object({ option_index: z.number().int().min(0) }).parse(req.body);
  if (option_index >= (poll.options || []).length) return res.status(400).json({ error: 'Opção inválida' });

  const userId = req.user!.id;
  const existing = await PollVote.findOne({ where: { poll_id: poll.id, user_id: userId } });
  if (existing) return res.status(409).json({ error: 'Você já votou nesta enquete' });

  await PollVote.create({ poll_id: poll.id, user_id: userId, option_index });
  res.status(201).json({ message: 'Voto registrado' });
}

// GET /api/polls/:id/my-vote — verifica se o usuário já votou
export async function myVote(req: AuthRequest, res: Response) {
  const vote = await PollVote.findOne({ where: { poll_id: req.params.id, user_id: req.user!.id } });
  res.json({ voted: !!vote, option_index: vote?.option_index ?? null });
}

// ===== ADMIN =====

const pollSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  options: z.array(z.string().min(1)).min(2).max(10),
  active: z.boolean().optional(),
  ends_at: z.string().optional(),
});

// POST /api/admin/polls
export async function createPoll(req: AuthRequest, res: Response) {
  const data = pollSchema.parse(req.body);
  const poll = await Poll.create({ ...data, ends_at: data.ends_at ? new Date(data.ends_at) : null });
  res.status(201).json(poll);
}

// PUT /api/admin/polls/:id
export async function updatePoll(req: AuthRequest, res: Response) {
  const poll = await Poll.findByPk(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Enquete não encontrada' });
  const data = pollSchema.partial().parse(req.body);
  await poll.update({ ...data, ends_at: data.ends_at ? new Date(data.ends_at) : poll.ends_at });
  res.json(poll);
}

// DELETE /api/admin/polls/:id
export async function deletePoll(req: AuthRequest, res: Response) {
  const poll = await Poll.findByPk(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Enquete não encontrada' });
  await PollVote.destroy({ where: { poll_id: poll.id } });
  await poll.destroy();
  res.json({ message: 'Enquete removida' });
}

// GET /api/admin/polls — lista todas (ativas e inativas)
export async function listAllPolls(req: AuthRequest, res: Response) {
  const polls = await Poll.findAll({ order: [['created_at', 'DESC']] });
  const result = [];
  for (const poll of polls) {
    const totalVotes = await PollVote.count({ where: { poll_id: poll.id } });
    result.push({ ...poll.toJSON(), totalVotes });
  }
  res.json(result);
}
