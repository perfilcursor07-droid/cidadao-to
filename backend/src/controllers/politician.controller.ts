import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Politician, PromiseModel, Vote, Rating } from '../models';

export async function list(req: Request, res: Response) {
  const { role, party, city, search } = req.query;
  const where: any = { active: true };
  if (role) where.role = role;
  if (party) where.party = party;
  if (city) where.city = city;
  if (search) where.name = { [Op.like]: `%${search}%` };

  const politicians = await Politician.findAll({ where, order: [['score', 'DESC']] });
  res.json(politicians);
}

export async function getById(req: Request, res: Response) {
  const politician = await Politician.findByPk(req.params.id);
  if (!politician) return res.status(404).json({ error: 'Político não encontrado', code: 'NOT_FOUND' });
  res.json(politician);
}

export async function getPromises(req: Request, res: Response) {
  const promises = await PromiseModel.findAll({ where: { politician_id: req.params.id } });
  res.json(promises);
}

export async function getVotes(req: Request, res: Response) {
  const votes = await Vote.findAll({ where: { politician_id: req.params.id } });
  const approve = votes.filter(v => v.type === 'approve').length;
  const disapprove = votes.filter(v => v.type === 'disapprove').length;
  res.json({ total: votes.length, approve, disapprove });
}

export async function getRatings(req: Request, res: Response) {
  const ratings = await Rating.findAll({ where: { politician_id: req.params.id } });
  res.json(ratings);
}
