import cron from 'node-cron';
import { fetchAndAnalyzeDiario } from '../services/diario.service';

export function startDiarioJob() {
  // Baixa D.O. todo dia às 8h
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Buscando Diário Oficial...');
    await fetchAndAnalyzeDiario();
  });
  console.log('[CRON] Job do Diário Oficial agendado (8h diariamente).');
}
