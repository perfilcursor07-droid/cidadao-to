import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Politician, PromiseModel, Vote, Rating } from '../models';
import User from '../models/User';
import DiarioAnalysis from '../models/DiarioAnalysis';
import News from '../models/News';
import { fetchAndAnalyzeDiario } from '../services/diario.service';
import { fetchAllPoliticosTO } from '../services/tse.service';
import { researchPoliticianPromises, researchAllPromises, updatePromisesStatus } from '../services/promises.service';
import { analyzePoliticianNepotism, analyzeAllNepotism } from '../services/nepotism.service';
import { env } from '../config/env';

// PUT /api/admin/politicians/:id — atualiza dados de um político
export async function updatePolitician(req: AuthRequest, res: Response) {
  const pol = await Politician.findByPk(req.params.id);
  if (!pol) return res.status(404).json({ error: 'Político não encontrado' });

  const { name, party, city, bio, photo_url, role, active } = req.body;
  await pol.update({
    ...(name !== undefined && { name }),
    ...(party !== undefined && { party }),
    ...(city !== undefined && { city }),
    ...(bio !== undefined && { bio }),
    ...(photo_url !== undefined && { photo_url }),
    ...(role !== undefined && { role }),
    ...(active !== undefined && { active }),
  });
  res.json(pol);
}

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

// POST /api/admin/politicians/reset — limpa TODOS e recria do seed
export async function resetPoliticians(req: AuthRequest, res: Response) {
  try {
    await Vote.destroy({ where: {} });
    await Rating.destroy({ where: {} });
    await PromiseModel.destroy({ where: {} });
    await Politician.destroy({ where: {} });

    const { seedPoliticians } = await import('../seeders/politicians.seeder');
    await seedPoliticians();

    const total = await Politician.count();
    res.json({ message: `Políticos resetados. ${total} registros criados.`, total });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/admin/promises/research/:id — pesquisa promessas de UM político
export async function researchPromises(req: AuthRequest, res: Response) {
  if (!env.TOGETHER_API_KEY) {
    return res.status(503).json({ error: 'TOGETHER_API_KEY não configurada' });
  }
  try {
    const result = await researchPoliticianPromises(Number(req.params.id));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/admin/promises/research-all — pesquisa promessas de TODOS
export async function researchAllPromisesEndpoint(req: AuthRequest, res: Response) {
  if (!env.TOGETHER_API_KEY) {
    return res.status(503).json({ error: 'TOGETHER_API_KEY não configurada' });
  }
  res.status(202).json({ message: 'Pesquisa iniciada em background. Pode demorar alguns minutos.' });
  researchAllPromises()
    .then(r => console.log(`[Promises] Pesquisa concluída: ${r.total_found} promessas encontradas`))
    .catch(e => console.error(`[Promises] Erro: ${e.message}`));
}

// POST /api/admin/promises/update-status — atualiza status das promessas
export async function updatePromisesStatusEndpoint(req: AuthRequest, res: Response) {
  if (!env.TOGETHER_API_KEY) {
    return res.status(503).json({ error: 'TOGETHER_API_KEY não configurada' });
  }
  try {
    const result = await updatePromisesStatus();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/admin/promises/reset — apaga todas e repesquisa
export async function resetPromises(req: AuthRequest, res: Response) {
  try {
    const count = await PromiseModel.count();
    await PromiseModel.destroy({ where: {} });
    res.json({ message: `${count} promessas removidas. Use "Pesquisar com IA" para recriar com fontes.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/admin/nepotism
export async function listNepotismAlerts(req: AuthRequest, res: Response) {
  const { NepotismAlert } = await import('../models');
  const alerts = await NepotismAlert.findAll({
    include: [{ model: Politician, as: 'politician' }],
    order: [['confidence', 'ASC'], ['created_at', 'DESC']],
  });
  res.json(alerts);
}

// POST /api/admin/nepotism/analyze/:id
export async function analyzeNepotism(req: AuthRequest, res: Response) {
  if (!env.TOGETHER_API_KEY) return res.status(503).json({ error: 'TOGETHER_API_KEY não configurada' });
  try {
    const result = await analyzePoliticianNepotism(Number(req.params.id));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/admin/nepotism/analyze-all
export async function analyzeAllNepotismEndpoint(req: AuthRequest, res: Response) {
  if (!env.TOGETHER_API_KEY) return res.status(503).json({ error: 'TOGETHER_API_KEY não configurada' });
  res.status(202).json({ message: 'Análise de nepotismo iniciada em background.' });
  analyzeAllNepotism()
    .then(r => console.log(`[Nepotismo] Concluído: ${r.total_alerts} alertas`))
    .catch(e => console.error(`[Nepotismo] Erro: ${e.message}`));
}

// DELETE /api/admin/nepotism/:id
export async function deleteNepotismAlert(req: AuthRequest, res: Response) {
  const { NepotismAlert } = await import('../models');
  const alert = await NepotismAlert.findByPk(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alerta não encontrado' });
  await alert.destroy();
  res.json({ message: 'Alerta removido' });
}
