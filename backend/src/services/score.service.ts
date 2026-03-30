import { Politician, Vote, Rating } from '../models';
import { fn, col } from 'sequelize';

export async function recalculateScore(politicianId: number) {
  const politician = await Politician.findByPk(politicianId);
  if (!politician) return;

  const votes = await Vote.findAll({ where: { politician_id: politicianId } });
  const totalVotes = votes.length;
  const approveVotes = votes.filter(v => v.type === 'approve').length;

  const ratings = await Rating.findAll({ where: { politician_id: politicianId } });
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + (Number(r.average) || 0), 0) / ratings.length
    : 0;

  // score = (approve/total * 60) + (avgRating/5 * 40)
  const voteScore = totalVotes > 0 ? (approveVotes / totalVotes) * 60 : 0;
  const ratingScore = (avgRating / 5) * 40;
  const score = parseFloat((voteScore + ratingScore).toFixed(2));

  await politician.update({ score, total_votes: totalVotes });
  return score;
}

export async function recalculateAllScores() {
  const politicians = await Politician.findAll({ where: { active: true } });
  for (const p of politicians) {
    await recalculateScore(p.id);
  }
  console.log(`Scores recalculados para ${politicians.length} políticos.`);
}
