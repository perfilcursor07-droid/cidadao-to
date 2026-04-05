import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { usePolitician, usePoliticianVotes } from '../hooks/usePoliticians';
import { usePromises } from '../hooks/usePromises';
import { useAuth } from '../hooks/useAuth';
import { useCreateVote } from '../hooks/useVote';
import { roleLabels } from '../types/politician';
import { getScoreColor, getScoreLabel } from '../utils/scoreHelpers';
import PromiseCard from '../components/promises/PromiseCard';
import api from '../services/api';
import RatingModal from '../components/politicians/RatingModal';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [.22, 1, .36, 1] } },
};

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function PoliticianDetail() {
  const { id } = useParams<{ id: string }>();
  const politicianId = Number(id);
  const { data: politician, isLoading } = usePolitician(politicianId);
  const { data: votes } = usePoliticianVotes(politicianId);
  const { data: promises } = usePromises({ politician_id: String(politicianId) });
  const { isAuthenticated } = useAuth();
  const voteMutation = useCreateVote();
  const [showRating, setShowRating] = useState(false);
  const [promiseFilter, setPromiseFilter] = useState<string>('all');
  const [expandedServidor, setExpandedServidor] = useState<string | null>(null);

  const isVereador = politician?.role === 'vereador';
  const now = new Date();
  const [salaryAno, setSalaryAno] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const [salaryMes, setSalaryMes] = useState(now.getMonth() === 0 ? 12 : now.getMonth());

  const { data: salaryData, isLoading: salaryLoading } = useQuery<{ politician_id: number; politician_name: string; total: number; dados: any[] }>({
    queryKey: ['salary-politician', politicianId, salaryAno, salaryMes],
    queryFn: () => api.get(`/salaries/vereador/${politicianId}?ano=${salaryAno}&mes=${salaryMes}`).then(r => r.data),
    enabled: isVereador,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-2 border-green border-t-transparent rounded-full" />
    </div>
  );

  if (!politician) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-3">🔍</div>
      <p className="text-ink font-medium mb-1">Político não encontrado</p>
      <Link to="/politicians" className="text-green text-sm hover:underline">← Voltar para lista</Link>
    </div>
  );

  const score = Number(politician.score);
  const approvePercent = votes && votes.total > 0 ? (votes.approve / votes.total) * 100 : 0;
  const total = politician.promises_total || 0;
  const done = politician.promises_done || 0;
  const progress = politician.promises_progress || 0;
  const failed = politician.promises_failed || 0;
  const pending = total - done - progress - failed;

  const handleVote = (type: 'approve' | 'disapprove') => {
    if (!isAuthenticated) return;
    voteMutation.mutate({ politician_id: politician.id, type });
  };

  const filteredPromises = promises?.filter(p => promiseFilter === 'all' ? true : p.status === promiseFilter) || [];
  const promiseCounts = {
    all: promises?.length || 0,
    done: promises?.filter(p => p.status === 'done').length || 0,
    progress: promises?.filter(p => p.status === 'progress').length || 0,
    pending: promises?.filter(p => p.status === 'pending').length || 0,
    failed: promises?.filter(p => p.status === 'failed').length || 0,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-xs text-muted">
        <Link to="/politicians" className="hover:text-green transition-colors">Políticos</Link>
        <span>/</span>
        <span className="text-ink font-medium">{politician.name}</span>
      </motion.nav>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="bg-gradient-to-br from-green-dark via-green to-green-light h-28 sm:h-32 relative">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\'%3E%3Cpath d=\'M20 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z\'/%3E%3C/g%3E%3C/svg%3E")',
          }} />
        </div>
        <div className="px-5 sm:px-8 pb-6 relative">
          <div className="-mt-14 mb-4 flex items-end justify-between">
            {politician.photo_url ? (
              <img src={politician.photo_url} alt={politician.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-white shadow-lg flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-muted">{getInitials(politician.name)}</span>
              </div>
            )}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl ${
              score >= 70 ? 'bg-green/10' : score >= 40 ? 'bg-gold/10' : score > 0 ? 'bg-red/10' : 'bg-gray-100'
            }`}>
              <span className={`text-2xl font-extrabold tabular-nums leading-none ${getScoreColor(score)}`}>{score.toFixed(0)}</span>
              <div>
                <div className="text-[9px] text-muted leading-none">score</div>
                <div className={`text-[10px] font-semibold leading-none ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
              </div>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink leading-tight">{politician.name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-green/10 text-green">{roleLabels[politician.role]}</span>
            {politician.party && <span className="text-xs text-ink2 font-medium bg-surface px-2 py-0.5 rounded-md">{politician.party}</span>}
            {politician.city && <span className="text-xs text-muted flex items-center gap-1">📍 {politician.city}</span>}
          </div>
          {politician.bio && (
            <p className="text-sm text-ink2 mt-3 leading-relaxed max-w-2xl">{politician.bio}</p>
          )}
        </div>
      </motion.div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Stats — só mostra cards com dados */}
          <motion.div
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            initial="hidden" animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          >
            {[
              score > 0 && { label: 'Score', value: score.toFixed(0), sub: getScoreLabel(score), color: getScoreColor(score), icon: '📊' },
              (votes?.total || 0) > 0 && { label: 'Votos', value: votes?.total || 0, sub: `${approvePercent.toFixed(0)}% aprovam`, color: 'text-ink', icon: '🗳️' },
              total > 0 && { label: 'Cumpridas', value: `${done}/${total}`, sub: `${Math.round((done/total)*100)}%`, color: 'text-green', icon: '✅' },
              progress > 0 && { label: 'Andamento', value: progress, sub: `de ${total} promessas`, color: 'text-blue', icon: '🔄' },
            ].filter(Boolean).map((s: any) => (
              <motion.div key={s.label} variants={fadeUp}
                className="bg-white border border-border rounded-xl p-3 hover:shadow-card transition-shadow">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm">{s.icon}</span>
                  <span className="text-[9px] text-muted uppercase tracking-wide font-semibold">{s.label}</span>
                </div>
                <div className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-[9px] text-muted mt-0.5">{s.sub}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Aprovação popular */}
          {votes && votes.total > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink">Aprovação Popular</span>
                <span className="text-[10px] text-muted">{votes.total} votos</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                <motion.div initial={{ width: 0 }} animate={{ width: `${approvePercent}%` }} transition={{ duration: 0.8, delay: 0.3 }} className="h-full bg-green" />
                <motion.div initial={{ width: 0 }} animate={{ width: `${100 - approvePercent}%` }} transition={{ duration: 0.8, delay: 0.3 }} className="h-full bg-red/20" />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-muted">👍 <span className="font-bold text-green">{votes.approve}</span> ({approvePercent.toFixed(0)}%)</span>
                <span className="text-[10px] text-muted">👎 <span className="font-bold text-red">{votes.disapprove}</span> ({(100-approvePercent).toFixed(0)}%)</span>
              </div>
            </motion.div>
          )}

          {/* Progresso das promessas */}
          {total > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink">Promessas</span>
                <span className="text-[10px] text-muted">{total} no total</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex mb-2">
                {done > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(done/total)*100}%` }} transition={{ duration: 0.7, delay: 0.2 }} className="h-full bg-green" />}
                {progress > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(progress/total)*100}%` }} transition={{ duration: 0.7, delay: 0.35 }} className="h-full bg-blue" />}
                {failed > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(failed/total)*100}%` }} transition={{ duration: 0.7, delay: 0.5 }} className="h-full bg-red" />}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Cumpridas', value: done, dot: 'bg-green', text: 'text-green' },
                  { label: 'Andamento', value: progress, dot: 'bg-blue', text: 'text-blue' },
                  { label: 'Pendentes', value: pending, dot: 'bg-gray-300', text: 'text-muted' },
                  { label: 'Descumpridas', value: failed, dot: 'bg-red', text: 'text-red' },
                ].map(item => (
                  <div key={item.label} className="flex flex-col items-center bg-surface rounded-lg py-2 px-1">
                    <span className={`w-2 h-2 rounded-full ${item.dot} mb-1`} />
                    <span className={`text-sm font-bold tabular-nums ${item.text}`}>{item.value}</span>
                    <span className="text-[8px] text-muted text-center leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Custo público — só para vereadores */}
          {isVereador && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
              className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>💸</span>
                    <span className="text-xs font-bold text-ink">Custo ao cidadão</span>
                  </div>
                  <p className="text-[10px] text-muted mt-0.5">Remuneração + gabinete pagos com dinheiro público</p>
                </div>
                <div className="flex gap-1.5">
                  <select value={salaryMes} onChange={e => setSalaryMes(Number(e.target.value))}
                    className="border border-border rounded-lg px-2 py-1 text-[11px] bg-surface focus:outline-none cursor-pointer">
                    {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => (
                      <option key={i} value={i+1}>{m}</option>
                    ))}
                  </select>
                  <select value={salaryAno} onChange={e => setSalaryAno(Number(e.target.value))}
                    className="border border-border rounded-lg px-2 py-1 text-[11px] bg-surface focus:outline-none cursor-pointer">
                    {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-4">
                {salaryLoading ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted py-6">
                    <div className="animate-spin w-3.5 h-3.5 border-2 border-green border-t-transparent rounded-full" />
                    Consultando transparência...
                  </div>
                ) : !salaryData || salaryData.dados.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-muted">Nenhum dado para este período.</p>
                  </div>
                ) : (() => {
                  const servidores = salaryData.dados;
                  const vereadorReg = servidores.find((s: any) => s.cargo?.toLowerCase().includes('vereador'));
                  const funcionarios = servidores.filter((s: any) => !s.cargo?.toLowerCase().includes('vereador'));
                  const totalGabinete = funcionarios.reduce((sum: number, s: any) => sum + (s.liquido || 0), 0);
                  const totalGeral = servidores.reduce((sum: number, s: any) => sum + (s.liquido || 0), 0);
                  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                  return (
                    <div className="space-y-3">
                      {/* Total destaque */}
                      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Total este mês</p>
                          <p className="text-xl font-extrabold text-amber-800 tabular-nums">{fmt(totalGeral)}</p>
                          <p className="text-[10px] text-amber-600">{funcionarios.length} funcionário{funcionarios.length !== 1 ? 's' : ''} no gabinete</p>
                        </div>
                        <span className="text-3xl opacity-20">🏛️</span>
                      </div>

                      {/* Breakdown */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-surface rounded-lg p-2.5 border border-border">
                          <p className="text-[9px] text-muted uppercase mb-1">Vereador líquido</p>
                          <p className="text-sm font-bold text-green tabular-nums">{vereadorReg ? fmt(vereadorReg.liquido) : '—'}</p>
                        </div>
                        <div className="bg-surface rounded-lg p-2.5 border border-border">
                          <p className="text-[9px] text-muted uppercase mb-1">Gabinete</p>
                          <p className="text-sm font-bold text-ink tabular-nums">{fmt(totalGabinete)}</p>
                        </div>
                        <div className="bg-surface rounded-lg p-2.5 border border-border">
                          <p className="text-[9px] text-muted uppercase mb-1">Bruto pago</p>
                          <p className="text-sm font-bold text-blue tabular-nums">
                            {fmt(servidores.reduce((s: number, r: any) => s + (r.proventos || 0), 0))}
                          </p>
                        </div>
                      </div>

                      {/* Vereador detalhe */}
                      {vereadorReg && (
                        <div className="border border-green/20 bg-green/5 rounded-lg px-3 py-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-green/20 flex items-center justify-center text-xs font-bold text-green shrink-0">{vereadorReg.nome[0]}</div>
                              <div>
                                <p className="text-xs font-semibold text-ink leading-tight">{vereadorReg.nome}</p>
                                <p className="text-[9px] text-muted">{vereadorReg.cargo}</p>
                              </div>
                            </div>
                            <p className="text-base font-extrabold text-green tabular-nums">{fmt(vereadorReg.liquido)}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-green/10 text-center">
                            <div><p className="text-[9px] text-muted">Base</p><p className="text-xs font-semibold tabular-nums">{fmt(vereadorReg.salarioBase)}</p></div>
                            <div><p className="text-[9px] text-muted">+ Proventos</p><p className="text-xs font-semibold text-green tabular-nums">{fmt(vereadorReg.proventos)}</p></div>
                            <div><p className="text-[9px] text-muted">− Descontos</p><p className="text-xs font-semibold text-red tabular-nums">{fmt(vereadorReg.descontos)}</p></div>
                          </div>
                        </div>
                      )}

                      {/* Funcionários */}
                      {funcionarios.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-ink mb-1.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue inline-block" />
                            Funcionários do gabinete
                          </p>
                          <div className="space-y-1">
                            {funcionarios.map((s: any) => {
                              const sKey = `detail-${s.matricula}`;
                              const sOpen = expandedServidor === sKey;
                              return (
                                <div key={sKey} className="border border-border rounded-lg overflow-hidden">
                                  <button onClick={() => setExpandedServidor(sOpen ? null : sKey)}
                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface/60 transition-colors text-left gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-muted shrink-0">{s.nome[0]}</div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium text-ink truncate">{s.nome}</p>
                                        <p className="text-[9px] text-muted truncate">{s.cargo}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-xs font-bold text-ink tabular-nums">{fmt(s.liquido)}</span>
                                      <motion.span animate={{ rotate: sOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-[9px] text-muted">▼</motion.span>
                                    </div>
                                  </button>
                                  <AnimatePresence>
                                    {sOpen && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                        <div className="border-t border-border px-3 py-2.5 bg-surface/40">
                                          <div className="grid grid-cols-3 gap-2 mb-2">
                                            <div className="text-center bg-white rounded p-1.5 border border-border">
                                              <p className="text-[8px] text-muted uppercase">Base</p>
                                              <p className="text-[10px] font-semibold tabular-nums">{fmt(s.salarioBase)}</p>
                                            </div>
                                            <div className="text-center bg-green/5 rounded p-1.5 border border-green/10">
                                              <p className="text-[8px] text-green uppercase">+ Prov.</p>
                                              <p className="text-[10px] font-semibold text-green tabular-nums">{fmt(s.proventos)}</p>
                                            </div>
                                            <div className="text-center bg-red/5 rounded p-1.5 border border-red/10">
                                              <p className="text-[8px] text-red uppercase">− Desc.</p>
                                              <p className="text-[10px] font-semibold text-red tabular-nums">{fmt(s.descontos)}</p>
                                            </div>
                                          </div>
                                          {s.eventos?.length > 0 && (
                                            <div className="space-y-0.5">
                                              {s.eventos.map((e: any, i: number) => (
                                                <div key={i} className="flex justify-between text-[10px] py-0.5 border-b border-border/30 last:border-0">
                                                  <span className="text-muted truncate mr-2">{e.evento}</span>
                                                  <span className={`font-semibold tabular-nums shrink-0 ${e.tipo === 1 ? 'text-green' : 'text-red'}`}>
                                                    {e.tipo === 1 ? '+' : '-'}{fmt(e.provento || e.desconto)}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <p className="text-[9px] text-muted text-center">
                        <a href="https://acessoainformacao.palmas.to.leg.br" target="_blank" rel="noopener noreferrer" className="text-green hover:underline">
                          Portal de Transparência — Câmara de Palmas
                        </a>
                      </p>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {/* Promessas */}
          {promises && promises.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold text-ink">Promessas de Campanha</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { key: 'all', label: 'Todas', count: promiseCounts.all },
                    { key: 'done', label: 'Cumpridas', count: promiseCounts.done },
                    { key: 'progress', label: 'Andamento', count: promiseCounts.progress },
                    { key: 'pending', label: 'Pendentes', count: promiseCounts.pending },
                    { key: 'failed', label: 'Descumpridas', count: promiseCounts.failed },
                  ].filter(f => f.key === 'all' || f.count > 0).map(f => (
                    <button key={f.key} onClick={() => setPromiseFilter(f.key)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-all ${
                        promiseFilter === f.key ? 'bg-green text-white' : 'bg-surface text-muted hover:bg-gray-200'
                      }`}>
                      {f.label} ({f.count})
                    </button>
                  ))}
                </div>
              </div>
              <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
                initial="hidden" animate="visible" className="space-y-2" key={promiseFilter}>
                {filteredPromises.map(p => (
                  <motion.div key={p.id} variants={fadeUp}><PromiseCard promise={p} /></motion.div>
                ))}
              </motion.div>
              {filteredPromises.length === 0 && (
                <div className="text-center py-5 text-muted text-xs">Nenhuma promessa com este filtro.</div>
              )}
            </motion.div>
          )}
        </div>

        {/* Coluna direita */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white border border-border rounded-xl p-4 sticky top-20">
            <p className="text-xs font-bold text-ink mb-3">Sua opinião</p>
            {isAuthenticated ? (
              <div className="space-y-2">
                <button onClick={() => handleVote('approve')} disabled={voteMutation.isPending}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-green/20 bg-green/5 hover:bg-green hover:text-white text-green transition-all duration-200 disabled:opacity-40 group">
                  <span className="text-lg">👍</span>
                  <div className="text-left">
                    <div className="text-xs font-semibold">Aprovar</div>
                    <div className="text-[9px] opacity-60 group-hover:opacity-80">Apoio este político</div>
                  </div>
                </button>
                <button onClick={() => handleVote('disapprove')} disabled={voteMutation.isPending}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-red/20 bg-red/5 hover:bg-red hover:text-white text-red transition-all duration-200 disabled:opacity-40 group">
                  <span className="text-lg">👎</span>
                  <div className="text-left">
                    <div className="text-xs font-semibold">Reprovar</div>
                    <div className="text-[9px] opacity-60 group-hover:opacity-80">Não apoio este político</div>
                  </div>
                </button>
                <div className="border-t border-border pt-2">
                  <button onClick={() => setShowRating(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gold/20 bg-gold/5 hover:bg-gold hover:text-white text-gold transition-all duration-200 group">
                    <span className="text-lg">⭐</span>
                    <div className="text-left">
                      <div className="text-xs font-semibold">Avaliar</div>
                      <div className="text-[9px] opacity-60 group-hover:opacity-80">Presença, transparência e mais</div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-3">
                <div className="text-2xl mb-1.5">🗳️</div>
                <p className="text-xs text-ink2 mb-2.5">Faça login para votar e avaliar</p>
                <Link to="/login" className="inline-block bg-green text-white text-xs font-semibold px-5 py-2 rounded-xl hover:bg-green-dark transition-colors">
                  Entrar
                </Link>
              </div>
            )}
          </motion.div>

          {/* Resumo promessas */}
          {total > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="bg-green/5 border-b border-border px-4 py-2.5">
                <p className="text-xs font-bold text-ink">Resumo</p>
              </div>
              <div className="p-4">
                <div className="text-center mb-3 pb-3 border-b border-border">
                  <div className={`text-2xl font-bold tabular-nums ${getScoreColor(score)}`}>
                    {total > 0 ? Math.round((done/total)*100) : 0}%
                  </div>
                  <div className="text-[10px] text-muted mt-0.5">Taxa de cumprimento</div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Total', value: total, color: 'text-ink' },
                    { label: 'Cumpridas', value: done, color: 'text-green', dot: 'bg-green' },
                    { label: 'Andamento', value: progress, color: 'text-blue', dot: 'bg-blue' },
                    { label: 'Pendentes', value: pending, color: 'text-muted', dot: 'bg-gray-300' },
                    { label: 'Descumpridas', value: failed, color: 'text-red', dot: 'bg-red' },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-[10px] text-muted">
                        {s.dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
                        {s.label}
                      </span>
                      <span className={`text-xs font-bold tabular-nums ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {showRating && <RatingModal politicianId={politician.id} onClose={() => setShowRating(false)} />}
    </div>
  );
}
