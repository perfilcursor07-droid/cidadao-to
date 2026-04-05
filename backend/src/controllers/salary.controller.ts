import { Request, Response } from 'express';
import { buscarServidores, buscarSalariosVereadoresComCache } from '../services/salary.service';

// GET /api/salaries/search?busca=&ano=&mes=&offset=&limit=
export async function searchSalaries(req: Request, res: Response) {
  const busca = (req.query.busca as string) || '';
  const ano = Number(req.query.ano) || new Date().getFullYear();
  const mes = Number(req.query.mes) || new Date().getMonth() + 1;
  const offset = Number(req.query.offset) || 0;
  const limite = Math.min(Number(req.query.limit) || 50, 100);

  try {
    const resultado = await buscarServidores(busca, ano, mes, offset, limite);
    res.json(resultado);
  } catch (error: any) {
    res.status(502).json({ error: 'Erro ao consultar API de transparência', detail: error.message });
  }
}

// GET /api/salaries/vereador/:id?ano=&mes=
// Usa o cache geral e filtra pelo político
export async function getSalariesByPolitician(req: Request, res: Response) {
  const Politician = (await import('../models/Politician')).default;
  const politician = await Politician.findByPk(req.params.id);
  if (!politician) return res.status(404).json({ error: 'Político não encontrado' });

  const ano = Number(req.query.ano) || new Date().getFullYear();
  const mes = Number(req.query.mes) || new Date().getMonth() + 1;

  try {
    const todos = await buscarSalariosVereadoresComCache(ano, mes);
    const match = todos.find((r: any) => r.politician_id === politician.id);
    res.json({
      politician_id: politician.id,
      politician_name: politician.name,
      total: match?.total || 0,
      dados: match?.servidores || [],
    });
  } catch (error: any) {
    res.status(502).json({ error: 'Erro ao consultar API de transparência', detail: error.message });
  }
}

// GET /api/salaries/vereadores?ano=&mes=
export async function getAllVereadoresSalaries(req: Request, res: Response) {
  const ano = Number(req.query.ano) || new Date().getFullYear();
  const mes = Number(req.query.mes) || new Date().getMonth() + 1;

  try {
    const resultados = await buscarSalariosVereadoresComCache(ano, mes);
    res.json({ ano, mes, resultados });
  } catch (error: any) {
    res.status(502).json({ error: 'Erro ao consultar API de transparência', detail: error.message });
  }
}
