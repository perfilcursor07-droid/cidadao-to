import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getExpensesRanking, getExpensesSummary, RankingItem } from '../services/expenses';

const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const months = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatMoney(v: number) { return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

export default function Expenses() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data: ranking, isLoading: loadingRank } = useQuery({ queryKey: ['expenses-ranking', year], queryFn: () => getExpensesRanking(year) });
  const { data: summary, isLoading: loadingSum } = useQuery({ queryKey: ['expenses-summary', year], queryFn: () => getExpensesSummary(year) });
  const maxTotal = ranking?.ranking?.[0]?.total || 1;
  const isLoading = loadingRank || loadingSum;
  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-ink">Gastos Parlamentares</h1>
        <p className="text-sm text-muted mt-0.5">Cota parlamentar (CEAP) dos deputados federais e senadores do Tocantins</p>
      </motion.div>

      {/* Ano selector + resumo */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {[currentYear - 1, currentYear].map(y => (
            <button key={y} onClick={() => setYear(y)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${year === y ? 'bg-green text-white' : 'bg-white border border-border text-muted hover:text-ink'}`}>
              {y}
            </button>
          ))}
        </div>
        {summary && (
          <div className="flex items-center gap-4 text-xs text-muted ml-auto">
            <span>Total: <span className="font-bold text-ink">{formatMoney(summary.total)}</span></span>
            <span>{summary.count} despesas</span>
          </div>
        )}
      </div>

      {/* Gráfico de barras por mês */}
      {summary?.byMonth && summary.byMonth.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-border rounded-xl p-4">
          <h2 className="text-sm font-bold text-ink mb-3">Gastos por mês</h2>
          <div className="flex items-end gap-1.5 h-32">
            {summary.byMonth.map((m: any) => {
              const maxMonth = Math.max(...summary.byMonth.map((x: any) => Number(x.total)));
              const pct = maxMonth > 0 ? (Number(m.total) / maxMonth) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-green/10 rounded-t relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                    <div className="absolute inset-0 bg-green rounded-t" style={{ height: '100%' }} />
                  </div>
                  <span className="text-[9px] text-muted">{months[m.month]}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Ranking */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-12 justify-center text-muted text-sm">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" /> Carregando gastos...
        </div>
      ) : !ranking?.ranking?.length ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <div className="text-3xl mb-2">💰</div>
          <p className="text-sm text-muted">Nenhum gasto registrado para {year}.</p>
          <p className="text-xs text-muted mt-1">Sincronize os gastos no painel admin.</p>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
          <h2 className="text-sm font-bold text-ink">Ranking de gastos — {year}</h2>
          {ranking.ranking.map((p: RankingItem, i: number) => {
            const pct = (Number(p.total) / Number(maxTotal)) * 100;
            return (
              <motion.div key={p.politician_id} variants={fadeUp}>
                <Link to={`/politicians/${p.politician_id}`}
                  className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3 hover:shadow-card transition-shadow group">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    i === 0 ? 'bg-red/10 text-red' : i < 3 ? 'bg-gold/10 text-gold' : 'bg-surface text-muted'
                  }`}>{i + 1}</span>
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-muted text-[10px] font-bold shrink-0">
                      {p.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink group-hover:text-green transition-colors truncate">{p.name}</span>
                      <span className="text-[10px] text-muted">{p.party}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[250px]">
                        <div className="h-full bg-red/60 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-muted tabular-nums">{Number(p.count)} despesas</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red tabular-nums shrink-0">{formatMoney(Number(p.total))}</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Categorias */}
      {summary?.byCategory && summary.byCategory.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-border rounded-xl p-4">
          <h2 className="text-sm font-bold text-ink mb-3">Por categoria</h2>
          <div className="space-y-2">
            {summary.byCategory.slice(0, 10).map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink truncate">{c.category}</p>
                  <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-blue/50 rounded-full" style={{ width: `${(Number(c.total) / Number(summary.total)) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs text-muted font-bold tabular-nums shrink-0">{formatMoney(Number(c.total))}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
