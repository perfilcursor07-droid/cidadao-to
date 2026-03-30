import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Politician, PromiseModel, Vote, Rating } from '../models';
import User from '../models/User';
import DiarioAnalysis from '../models/DiarioAnalysis';
import News from '../models/News';
import { fetchAndAnalyzeDiario } from '../services/diario.service';
import { fetchAllPoliticosTO } from '../services/tse.service';

// GET /api/admin/stats
export async function getStats(req: AuthRequest, res: Response) {
  const [users, politicians, promises, news, diarios, votes, ratings] = await Promise.all([
    User.count(),
    Politician.count(),
    PromiseModel.count(),
    News.count(),
    DiarioAnalysis.count(),
    Vote.count(),
    Rating.count(),
  ]);
  res.json({ users, politicians, promises, news, diarios, votes, ratings });
}

// GET /api/admin/users
export async function listUsers(req: AuthRequest, res: Response) {
  const users = await User.findAll({
    attributes: ['id', 'name', 'email', 'role', 'city', 'verified', 'created_at'],
    order: [['created_at', 'DESC']],
  });
  res.json(users);
}

// GET /api/admin/diario
export async function listDiarios(req: AuthRequest, res: Response) {
  const analyses = await DiarioAnalysis.findAll({
    order: [['edition_date', 'DESC']],
    attributes: ['id', 'edition', 'edition_date', 'summary', 'alerts', 'keywords', 'ai_model', 'created_at'],
  });
  res.json(analyses);
}


// POST /api/admin/diario/fetch — baixa diário de qualquer data
export async function fetchDiario(req: AuthRequest, res: Response) {
  const { date } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Data inválida. Use YYYY-MM-DD.' });
  }

  try {
    const result = await fetchAndAnalyzeDiario(date);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// DELETE /api/admin/diario/:id
export async function deleteDiario(req: AuthRequest, res: Response) {
  const analysis = await DiarioAnalysis.findByPk(req.params.id);
  if (!analysis) return res.status(404).json({ error: 'Análise não encontrada' });
  await analysis.destroy();
  res.json({ message: 'Análise removida' });
}

// POST /api/admin/politicians/sync
export async function syncPoliticians(req: AuthRequest, res: Response) {
  try {
    const dados = await fetchAllPoliticosTO();
    const todos = [
      ...dados.governador, ...dados.senadores, ...dados.deputados_federais,
      ...dados.deputados_estaduais, ...dados.prefeitos, ...dados.vereadores,
    ];

    let created = 0, updated = 0;
    for (const pol of todos) {
      const [record, wasCreated] = await Politician.findOrCreate({
        where: { name: pol.name, role: pol.role },
        defaults: { ...pol, active: true },
      });
      if (!wasCreated) {
        await record.update({ party: pol.party, photo_url: pol.photo_url, bio: pol.bio, city: pol.city });
        updated++;
      } else {
        created++;
      }
    }

    res.json({ message: 'Sincronização concluída', resumo: dados.resumo, total: todos.length, created, updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
