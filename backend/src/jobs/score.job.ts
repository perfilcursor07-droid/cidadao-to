import cron from 'node-cron';
import { recalculateAllScores } from '../services/score.service';

export function startScoreJob() {
  // Recalcula scores a cada hora
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Recalculando scores dos políticos...');
    await recalculateAllScores();
  });
  console.log('[CRON] Job de score agendado (a cada hora).');
}
