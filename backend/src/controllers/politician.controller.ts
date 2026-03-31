import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Politician, PromiseModel, Vote, Rating } from '../models';
import { fetchAllPoliticosTO } from '../services/tse.service';

export async function list(req: Request, res: Response) {
  const { role, party, city, search } = req.query;
  const where: any = { active: true };
  if (role) where.role = role;
  if (party) where.party = party;
  if (city) where.city = city;
  if (search) where.name = { [Op.like]: `%${search}%` };

  const politicians = await Politician.findAll({ where, order: [['score', 'DESC']] });

  // Busca contagem de promessas por político
  const ids = politicians.map(p => p.id);
  const promiseCounts = await PromiseModel.findAll({
    where: { politician_id: { [Op.in]: ids } },
    attributes: [
      'politician_id',
      [fn('COUNT', col('id')), 'total'],
      [fn('SUM', literal("CASE WHEN status = 'done' THEN 1 ELSE 0 END")), 'done'],
      [fn('SUM', literal("CASE WHEN status = 'progress' THEN 1 ELSE 0 END")), 'progress'],
      [fn('SUM', literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed'],
    ],
    group: ['politician_id'],
    raw: true,
  }) as any[];

  const countMap = new Map(promiseCounts.map((c: any) => [c.politician_id, c]));

  const result = politicians.map(p => {
    const counts = countMap.get(p.id);
    return {
      ...p.toJSON(),
      promises_total: Number(counts?.total || 0),
      promises_done: Number(counts?.done || 0),
      promises_progress: Number(counts?.progress || 0),
      promises_failed: Number(counts?.failed || 0),
    };
  });

  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const politician = await Politician.findByPk(req.params.id);
  if (!politician) return res.status(404).json({ error: 'Político não encontrado', code: 'NOT_FOUND' });

  // Contagem de promessas
  const promiseCounts = await PromiseModel.findAll({
    where: { politician_id: politician.id },
    attributes: [
      [fn('COUNT', col('id')), 'total'],
      [fn('SUM', literal("CASE WHEN status = 'done' THEN 1 ELSE 0 END")), 'done'],
      [fn('SUM', literal("CASE WHEN status = 'progress' THEN 1 ELSE 0 END")), 'progress'],
      [fn('SUM', literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed'],
    ],
    raw: true,
  }) as any[];

  const counts = promiseCounts[0] || {};
  res.json({
    ...politician.toJSON(),
    promises_total: Number(counts.total || 0),
    promises_done: Number(counts.done || 0),
    promises_progress: Number(counts.progress || 0),
    promises_failed: Number(counts.failed || 0),
  });
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


// Sincroniza TODOS os políticos do TO das APIs oficiais + dados estáticos
export async function syncFromAPIs(req: Request, res: Response) {
  try {
    const dados = await fetchAllPoliticosTO();
    const todos = [
      ...dados.governador,
      ...dados.senadores,
      ...dados.deputados_federais,
      ...dados.deputados_estaduais,
      ...dados.prefeitos,
      ...dados.vereadores,
    ];

    let created = 0;
    let updated = 0;

    for (const pol of todos) {
      const [record, wasCreated] = await Politician.findOrCreate({
        where: { name: pol.name, role: pol.role },
        defaults: { ...pol, active: true },
      });

      if (!wasCreated) {
        await record.update({
          party: pol.party,
          photo_url: pol.photo_url,
          bio: pol.bio,
          city: pol.city,
        });
        updated++;
      } else {
        created++;
      }
    }

    res.json({
      message: 'Sincronização concluída',
      resumo: dados.resumo,
      total: todos.length,
      created,
      updated,
    });
  } catch (error) {
    console.error('Erro na sincronização:', error);
    res.status(500).json({ error: 'Erro ao sincronizar dados das APIs' });
  }
}

// Lista políticos agrupados por cargo
export async function listByRole(req: Request, res: Response) {
  const politicians = await Politician.findAll({
    where: { active: true },
    order: [['role', 'ASC'], ['score', 'DESC']],
  });

  const grouped = {
    governador: politicians.filter(p => p.role === 'governador'),
    senadores: politicians.filter(p => p.role === 'senador'),
    deputados_federais: politicians.filter(p => p.role === 'dep_federal'),
    deputados_estaduais: politicians.filter(p => p.role === 'dep_estadual'),
    prefeitos: politicians.filter(p => p.role === 'prefeito'),
    vereadores: politicians.filter(p => p.role === 'vereador'),
  };

  res.json(grouped);
}
