import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { syncAllExpenses, getExpensesByPolitician } from '../services/expenses.service';
import Expense from '../models/Expense';
import Politician from '../models/Politician';
import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

// GET /api/expenses/politician/:id?year=2025
export async function getPoliticianExpenses(req: Request, res: Response) {
  const id = Number(req.params.id);
  const year = req.query.year ? Number(req.query.year) : undefined;
  try {
    const data = await getExpensesByPolitician(id, year);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/expenses/ranking?year=2025
export async function getExpensesRanking(req: Request, res: Response) {
  const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
  try {
    const ranking = await sequelize.query(`
      SELECT e.politician_id, p.name, p.party, p.role, p.photo_url,
        SUM(e.amount) as total, COUNT(e.id) as count
      FROM expenses e
      JOIN politicians p ON p.id = e.politician_id
      WHERE e.year = :year
      GROUP BY e.politician_id, p.name, p.party, p.role, p.photo_url
      ORDER BY total DESC
    `, { replacements: { year }, type: QueryTypes.SELECT });
    res.json({ year, ranking });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/expenses/summary?year=2025
export async function getExpensesSummary(req: Request, res: Response) {
  const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
  try {
    const [totalResult] = await sequelize.query(`
      SELECT SUM(amount) as total, COUNT(id) as count FROM expenses WHERE year = :year
    `, { replacements: { year }, type: QueryTypes.SELECT }) as any[];

    const byCategory = await sequelize.query(`
      SELECT category, SUM(amount) as total, COUNT(id) as count
      FROM expenses WHERE year = :year
      GROUP BY category ORDER BY total DESC
    `, { replacements: { year }, type: QueryTypes.SELECT });

    const byMonth = await sequelize.query(`
      SELECT month, SUM(amount) as total, COUNT(id) as count
      FROM expenses WHERE year = :year
      GROUP BY month ORDER BY month ASC
    `, { replacements: { year }, type: QueryTypes.SELECT });

    res.json({ year, total: Number(totalResult?.total || 0), count: Number(totalResult?.count || 0), byCategory, byMonth });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/admin/expenses/sync
export async function syncExpenses(req: AuthRequest, res: Response) {
  const year = req.body.year ? Number(req.body.year) : undefined;
  try {
    const result = await syncAllExpenses(year);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
