import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PageTitle from '../components/shared/PageTitle';

const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const medals = ['🥇', '🥈', '🥉'];

interface SalaryEvent { evento: string; tipo: number; provento: number; desconto: number; }
interface Servidor {
  matricula: string; nome: string; cargo: string; lotacao: string; vinculo: string;
  situacao: string; salarioBase: number; proventos: number; descontos: number; liquido: number;
  eventos: SalaryEvent[];
}
interface VereadorResult { politician_id: number; politician_name: string; servidores: Servidor[]; total: number; }

export default function Salaries() {
  const now = new Date();
  const mesDefault = now.getMonth() === 0 ? 12 : now.getMonth();
  const anoDefault = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const [ano, setAno] = useState(anoDefault);
  const [mes, setMes] = useState(mesDefault);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [expandedServidor, setExpandedServidor] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery<{ ano: number; mes: number; resultados: VereadorResult[] }>({
    queryKey: ['salaries-vereadores', ano, mes],
    queryFn: () => api.get(`/salaries/vereadores?ano=${ano}&mes=${mes}`).then(r => r.data),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
  });

  const resultados = (data?.resultados || [])
    .map(r => {
      const totalLiquido = r.servidores.reduce((s, sv) => s + sv.liquido, 0);
      const vereador = r.servidores.find(s => s.cargo?.toLowerCase().includes('vereador'));
      const funcionarios = r.servidores.filter(s => !s.cargo?.toLowerCase().includes('vereador'));
      return { ...r, totalLiquido, vereador, funcionarios };
    })
    .filter(r => r.totalLiquido > 0)
    .sort((a, b) => b.totalLiquido - a.totalLiquido);

  const filtered = resultados.filter(r =>
    !search || r.politician_name.toLowerCase().includes(search.toLowerCase()) ||
    r.servidores.some(s => s.nome.toLowerCase().includes(search.toLowerCase()))
  );

  const custoTotal = resultados.reduce((s, r) => s + r.totalLiquido, 0);
  const totalFunc = resultados.reduce((s, r) => s + r.funcionarios.length, 0);
  const maxTotal = resultados[0]?.totalLiquido || 1;
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div>
      <PageTitle title="Custômetro da Câmara de Palmas" subtitle="Ranking dos vereadores por custo total (salário + gabinete) — dados públicos de transparência" />

      {/* Stats + Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-red-50 to-white border border-red/10 rounded-xl p-4">
          <p className="text-[10px] text-muted uppercase tracking-wide">Custo total/mês</p>
          <p className="text-xl font-black text-red tabular-nums mt-1">{fmt(custoTotal)}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted uppercase tracking-wide">Vereadores</p>
          <p className="text-xl font-black text-ink tabular-nums mt-1">{resultados.length}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted uppercase tracking-wide">Funcionários</p>
          <p className="text-xl font-black text-ink tabular-nums mt-1">{totalFunc}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted uppercase tracking-wide">Média/gabinete</p>
          <p className="text-xl font-black text-ink tabular-nums mt-1">{resultados.length > 0 ? fmt(custoTotal / resultados.length) : '—'}</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg p-4 mb-6 flex flex-col md:flex-row gap-3 items-start md:items-center">
        <input type="text" placeholder="Buscar vereador ou servidor..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-green/20 w-full md:w-64" />
        <div className="flex gap-2 items-center">
          <select value={mes} onChange={e => setMes(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none">
            {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none">
            {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted text-sm">
          <div className="animate-spin w-6 h-6 border-2 border-green border-t-transparent rounded-full mx-auto mb-3" />
          Consultando API de transparência...
        </div>
      ) : error ? (
        <div className="bg-red/5 border border-red/20 rounded-lg p-6 text-center">
          <p className="text-sm text-red">Erro ao consultar dados de transparência</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">Nenhum resultado encontrado.</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r, idx) => {
            const pos = resultados.indexOf(r) + 1;
            const isOpen = expanded === r.politician_id;
            const pct = (r.totalLiquido / maxTotal) * 100;

            return (
              <motion.div key={r.politician_id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`bg-white border rounded-xl overflow-hidden transition-colors ${
                  pos <= 3 ? 'border-red/20 shadow-sm' : 'border-border'
                }`}>
                <button onClick={() => setExpanded(isOpen ? null : r.politician_id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface/50 transition-colors text-left">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    pos === 1 ? 'bg-red text-white' : pos === 2 ? 'bg-orange-400 text-white' : pos === 3 ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-muted'
                  }`}>{pos <= 3 ? medals[pos - 1] : pos}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <Link to={`/politicians/${r.politician_id}`}
                        className="text-sm font-bold text-ink hover:text-green transition-colors truncate"
                        onClick={e => e.stopPropagation()}>{r.politician_name}</Link>
                      <p className={`text-base font-black tabular-nums shrink-0 ml-3 ${pos <= 3 ? 'text-red' : 'text-ink'}`}>{fmt(r.totalLiquido)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.05 }}
                          className={`h-full rounded-full ${pos === 1 ? 'bg-red' : pos <= 3 ? 'bg-orange-400' : 'bg-green/60'}`} />
                      </div>
                      <span className="text-[10px] text-muted shrink-0 tabular-nums whitespace-nowrap">
                        {r.funcionarios.length} func. · Salário: {r.vereador ? fmt(r.vereador.liquido) : '—'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-muted text-xs transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="border-t border-border px-5 py-4 space-y-2">
                        {r.vereador && (
                          <div className="bg-green/5 border border-green/15 rounded-lg p-3 flex items-center justify-between mb-3">
                            <div>
                              <p className="text-[10px] text-muted uppercase">Vereador(a)</p>
                              <p className="text-sm font-semibold text-ink">{r.vereador.nome}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted">Proventos: {fmt(r.vereador.proventos)} · Descontos: {fmt(r.vereador.descontos)}</p>
                              <p className="text-base font-bold text-green tabular-nums">{fmt(r.vereador.liquido)}</p>
                            </div>
                          </div>
                        )}
                        {r.funcionarios.length > 0 && (
                          <p className="text-xs font-bold text-ink">Funcionários do gabinete ({r.funcionarios.length})</p>
                        )}
                        {r.funcionarios.map(s => {
                          const sKey = `${r.politician_id}-${s.matricula}`;
                          const sOpen = expandedServidor === sKey;
                          return (
                            <div key={sKey} className="border border-border/60 rounded-lg overflow-hidden">
                              <button onClick={() => setExpandedServidor(sOpen ? null : sKey)}
                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface/30 transition-colors text-left">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-ink truncate">{s.nome}</p>
                                  <p className="text-[11px] text-muted">{s.cargo}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <p className="text-sm font-bold text-green tabular-nums">{fmt(s.liquido)}</p>
                                  <span className={`text-xs text-muted transition-transform ${sOpen ? 'rotate-180' : ''}`}>▼</span>
                                </div>
                              </button>
                              <AnimatePresence>
                                {sOpen && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="border-t border-border/40 px-4 py-3 bg-surface/30">
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                                        <div><p className="text-[10px] text-muted">Base</p><p className="text-sm tabular-nums">{fmt(s.salarioBase)}</p></div>
                                        <div><p className="text-[10px] text-muted">Proventos</p><p className="text-sm text-green tabular-nums">{fmt(s.proventos)}</p></div>
                                        <div><p className="text-[10px] text-muted">Descontos</p><p className="text-sm text-red tabular-nums">{fmt(s.descontos)}</p></div>
                                        <div><p className="text-[10px] text-muted">Líquido</p><p className="text-sm font-bold tabular-nums">{fmt(s.liquido)}</p></div>
                                      </div>
                                      {s.eventos.length > 0 && (
                                        <div className="space-y-1 mt-2">
                                          {s.eventos.map((e, i) => (
                                            <div key={i} className="flex justify-between text-xs py-0.5">
                                              <span className="text-muted truncate mr-2">{e.evento}</span>
                                              <span className={`font-medium tabular-nums shrink-0 ${e.tipo === 1 ? 'text-green' : 'text-red'}`}>
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-6 bg-surface border border-border rounded-lg p-4 space-y-1.5">
        <p className="text-[10px] font-semibold text-ink">Sobre estes dados</p>
        <p className="text-[10px] text-muted leading-relaxed">
          ¹ Todos os valores exibidos são dados públicos extraídos do <a href="https://acessoainformacao.palmas.to.leg.br" target="_blank" rel="noopener noreferrer" className="text-green underline hover:text-green-dark">Portal de Transparência da Câmara Municipal de Palmas</a>, conforme a Lei de Acesso à Informação (Lei nº 12.527/2011).
        </p>
        <p className="text-[10px] text-muted leading-relaxed">
          ² O custo total de cada gabinete inclui o salário líquido do vereador(a) e de todos os servidores comissionados lotados em seu gabinete, conforme publicado na folha de pagamento oficial.
        </p>
        <p className="text-[10px] text-muted leading-relaxed">
          ³ O ranking é ordenado pelo custo total (vereador + gabinete) de forma decrescente. Não expressa opinião, juízo de valor ou qualquer tipo de denúncia. O objetivo é facilitar o acesso do cidadão a informações que já são públicas por lei.
        </p>
        <p className="text-[10px] text-muted leading-relaxed">
          ⁴ Os dados são atualizados automaticamente nos dias 15 e 30 de cada mês. A folha de pagamento de um mês é publicada no mês seguinte pela Câmara.
        </p>
      </div>
    </div>
  );
}
