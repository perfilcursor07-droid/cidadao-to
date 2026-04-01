import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { adminSyncExpenses, getExpensesRanking, getExpensesSummary } from '../../services/expenses';

function formatMoney(v: number) { return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }
const months = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function AdminExpenses() {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: ranking, isLoading: lr } = useQuery({ queryKey: ['expenses-ranking', year], queryFn: () => getExpensesRanking(year) });
  const { data: summary, isLoading: ls } = useQuery({ queryKey: ['expenses-summary', year], queryFn: () => getExpensesSummary(year) });
  const isLoading = lr || ls;

  const handleSync = async () => {
    setSyncing(true); setResult(null);
    try {
      const r = await adminSyncExpenses(year);
      setResult({ message: `${r.total} novas despesas de ${r.politicians} parlamentares sincronizadas.` });
      qc.invalidateQueries({ queryKey: ['expenses-ranking'] });
      qc.invalidateQueries({ queryKey: ['expenses-summary'] });
    } catch (e: any) { setResult({ error: e?.response?.data?.error || 'Erro ao sincronizar' }); }
    setSyncing(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Gastos Parlamentares</h1>
          <p className="text-sm text-white/40 mt-0.5">Cota parlamentar (CEAP) — Câmara, Senado e Assembleia TO</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1">
            {[currentYear - 1, currentYear].map(y => (
              <button key={y} onClick={() => setYear(y)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${year === y ? 'bg-green text-white' : 'bg-white/[0.04] text-white/50 border border-white/[0.06] hover:text-white/80'}`}>
                {y}
              </button>
            ))}
          </div>
          <button onClick={handleSync} disabled={syncing}
            className="px-4 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors disabled:opacity-40 flex items-center gap-2">
            {syncing ? <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Sincronizando...</> : '🔄 Sincronizar Gastos'}
          </button>
        </div>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`text-sm px-4 py-3 rounded-lg ${result.error ? 'bg-red/10 text-red border border-red/20' : 'bg-green/10 text-green border border-green/20'}`}>
          {result.error || result.message}
        </motion.div>
      )}

      {/* Resumo */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-red tabular-nums">{formatMoney(summary.total)}</div>
            <div className="text-[10px] text-white/30 mt-1">Total gasto</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-white tabular-nums">{summary.count}</div>
            <div className="text-[10px] text-white/30 mt-1">Despesas</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-blue tabular-nums">{ranking?.ranking?.length || 0}</div>
            <div className="text-[10px] text-white/30 mt-1">Parlamentares</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-gold tabular-nums">{summary.byCategory?.length || 0}</div>
            <div className="text-[10px] text-white/30 mt-1">Categorias</div>
          </div>
        </div>
      )}

      {/* Gráfico por mês */}
      {summary?.byMonth && summary.byMonth.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <h2 className="text-sm font-bold text-white/80 mb-3">Gastos por mês</h2>
          <div className="flex items-end gap-1.5 h-28">
            {summary.byMonth.map((m: any) => {
              const maxM = Math.max(...summary.byMonth.map((x: any) => Number(x.total)));
              const pct = maxM > 0 ? (Number(m.total) / maxM) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1" title={formatMoney(Number(m.total))}>
                  <div className="w-full rounded-t relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                    <div className="absolute inset-0 bg-red/40 rounded-t hover:bg-red/60 transition-colors" />
                  </div>
                  <span className="text-[9px] text-white/30">{months[m.month]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ranking */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-8 justify-center text-white/30 text-sm">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" /> Carregando...
        </div>
      ) : !ranking?.ranking?.length ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-10 text-center">
          <div className="text-3xl mb-2">💰</div>
          <p className="text-sm text-white/40">Nenhum gasto registrado para {year}.</p>
          <p className="text-xs text-white/25 mt-1">Clique em "Sincronizar Gastos" para puxar dados da Câmara e Senado.</p>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.04] flex items-center gap-2">
            <span className="text-sm font-bold text-white/80">Ranking de gastos — {year}</span>
            <span className="text-[10px] text-white/25 ml-auto">{ranking.ranking.length} parlamentares</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {ranking.ranking.map((p: any, i: number) => {
              const maxT = Number(ranking.ranking[0]?.total || 1);
              const pct = (Number(p.total) / maxT) * 100;
              return (
                <div key={p.politician_id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    i === 0 ? 'bg-red/20 text-red' : i < 3 ? 'bg-gold/15 text-gold' : 'bg-white/[0.04] text-white/30'
                  }`}>{i + 1}</span>
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/[0.08] shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/25 text-[10px] font-bold shrink-0">
                      {p.name?.split(' ').slice(0, 2).map((w: string) => w[0]).join('')}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/75 font-medium truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden max-w-[200px]">
                        <div className="h-full bg-red/50 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-white/25">{p.party} · {Number(p.count)} despesas</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red tabular-nums shrink-0">{formatMoney(Number(p.total))}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categorias */}
      {summary?.byCategory && summary.byCategory.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <h2 className="text-sm font-bold text-white/80 mb-3">Top categorias</h2>
          <div className="space-y-2">
            {summary.byCategory.slice(0, 8).map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60 truncate">{c.category}</p>
                  <div className="h-1 bg-white/[0.04] rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-blue/40 rounded-full" style={{ width: `${(Number(c.total) / Number(summary.total)) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs text-white/40 font-bold tabular-nums shrink-0">{formatMoney(Number(c.total))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
