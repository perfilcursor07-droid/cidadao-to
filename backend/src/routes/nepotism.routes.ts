import { Router } from 'express';
import Politician from '../models/Politician';
import NepotismAlert from '../models/NepotismAlert';
import { Op } from 'sequelize';

const router = Router();

// GET /api/nepotism/tree — retorna vínculos agrupados por político (público)
router.get('/tree', async (_req, res) => {
  try {
    const alerts = await NepotismAlert.findAll({
      where: { status: { [Op.ne]: 'descartado' } },
      include: [{ model: Politician, as: 'politician', attributes: ['id', 'name', 'role', 'party', 'photo_url', 'city'] }],
      order: [['confidence', 'ASC'], ['created_at', 'DESC']],
    });

    // Agrupa por político
    const grouped: Record<number, any> = {};
    for (const a of alerts) {
      const pol = (a as any).politician;
      if (!pol) continue;
      if (!grouped[pol.id]) {
        grouped[pol.id] = {
          politician: { id: pol.id, name: pol.name, role: pol.role, party: pol.party, photo_url: pol.photo_url, city: pol.city },
          relatives: [],
        };
      }
      grouped[pol.id].relatives.push({
        id: a.id,
        name: a.relative_name,
        role: a.relative_role,
        relationship: a.relationship,
        institution: a.institution,
        evidence: a.evidence,
        confidence: a.confidence,
        status: a.status,
        source_url: a.source_url,
        source_title: a.source_title,
      });
    }

    res.json(Object.values(grouped));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
