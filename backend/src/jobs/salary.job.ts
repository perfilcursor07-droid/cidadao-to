import cron from 'node-cron';
import { atualizarCacheSalarios } from '../services/salary.service';

/**
 * Atualiza cache de salários nos dias 15 e 30 de cada mês às 6h.
 * Também popula o cache na inicialização se estiver vazio.
 */
export function startSalaryJob() {
  // Dia 15 às 06:00
  cron.schedule('0 6 15 * *', () => {
    console.log('[CRON] Atualizando cache de salários (dia 15)...');
    atualizarCacheSalarios();
  });

  // Dia 30 às 06:00
  cron.schedule('0 6 30 * *', () => {
    console.log('[CRON] Atualizando cache de salários (dia 30)...');
    atualizarCacheSalarios();
  });

  console.log('[CRON] Job de salários agendado (dias 15 e 30).');

  // Popula cache na inicialização (com delay de 5s para o banco estar pronto)
  setTimeout(() => {
    atualizarCacheSalarios().then(() => {
      console.log('[CRON] Cache de salários populado na inicialização.');
    }).catch(() => {});
  }, 5000);
}
