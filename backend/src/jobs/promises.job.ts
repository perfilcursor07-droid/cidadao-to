import cron from 'node-cron';
import { updatePromisesStatus } from '../services/promises.service';

export function startPromisesJob() {
  // Atualiza status das promessas diariamente às 10h
  cron.schedule('0 10 * * *', async () => {
    console.log('[CRON] Atualizando status das promessas...');
    try {
      const result = await updatePromisesStatus();
      console.log(`[CRON] Promessas: ${result.updated} atualizadas`);
    } catch (err: any) {
      console.error(`[CRON] Erro ao atualizar promessas: ${err.message}`);
    }
  });
  console.log('[CRON] Job de promessas agendado (10h diariamente).');
}
