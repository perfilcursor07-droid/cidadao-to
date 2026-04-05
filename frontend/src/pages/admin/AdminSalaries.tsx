import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

interface SalaryEvent { evento: string; tipo: number; provento: number; desconto: number; }
interface Servidor {
  matricula: string; nome: string; cargo: string; lotacao: string; vinculo: string;
  situacao: string; salarioBase: number; proventos: number; descontos: number; liquido: number;
  eventos: SalaryEvent[];
}
interface VereadorResult {
  politician_id: number; politician_name: string;
  servidores: Servidor[]; total: number;
}

export default function AdminSalaries() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [expandedServidor, setExpandedServidor] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery<{ ano: number; mes: number; resultados: VereadorResult[] }>({
    queryKey: ['admin-salaries', ano, mes],
    queryFn: () => api.get(`/salaries/vereadores?ano=${ano}&mes=${mes}`).then(r => r.data),
  });

  const resultados = data?.resultados || [];
  const filtered = resultados.filter(r =>
    !search || r.politician_name.toLowerCase().includes(search.toLowerCase()) ||
    r.servidores.some(s => s.nome.toLowerCase().includes(search.toLowerCase()))
  );

  const totalGeral = resultados.reduce((sum, r) =>
    sum + r.servidores.reduce((s, sv) => s + sv.liquido, 0), 0
  );
  const totalServidores = resultados.reduce((sum, r) => sum + r.servidores.length, 0);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Salários e Servidores</h1>
          <p className="text-sm text-white/40 mt-0.5">Dados da API de Transparência — Câmara de Palmas</p>
        </div>
        {!isLoading && resultados.length > 0 && (
          <div className="flex gap-4 text-xs">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-center">
              <p className="text-white/30">Servidores</p>
              <p className="text-white font-bold tabular-nums">{totalServidores}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-center">
              <p className="text-white/30">Total líquido</p>
              <p className="text-green font-bold tabular-nums">{fmt(totalGeral)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar vereador ou servidor..."
          className="flex-1 bg-white/[0.03] border border-white/[0.06] text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-green/30 placeholder:text-white/20" />
        <div className="flex gap-2">
          <select value={mes} onChange={e => setMes(Number(e.target.value))}
            className="bg-white/[0.03] border border-white/[0.06] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-green/30">
            {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))}
            className="bg-white/[0.03] border border-white/[0.06] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-green/30">
            {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-white/30 py-6">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" /> Consultando API de transparência...
        </div>
      ) : error ? (
        <div className="bg-red/10 border border-red/20 rounded-lg p-4 text-sm text-red">
          Erro ao consultar API de transparência. Tente novamente.
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">🔎</div>
          <p className="text-sm text-white/40">Nenhum resultado encontrado</p>
        </div>
      ) : (
        <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
          initial="hidden" animate="visible" className="space-y-2.5">
          {filtered.map(r => {
            const isOpen = expanded === r.politician_id;
            const totalLiquido = r.servidores.reduce((s, sv) => s + sv.liquido, 0);
            const vereadorServidor = r.servidores.find(s =>
              s.cargo?.toLowerCase().includes('vereador') ||
              s.nome.toLowerCase().includes(r.politician_name.split(' ')[0].toLowerCase())
            );

            return (
              <motion.div key={r.politician_id} variants={fadeUp}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.1] transition-colors">
                <button onClick={() => setExpanded(isOpen ? null : r.politician_id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-green/10 flex items-center justify-center text-green text-xs font-bold shrink-0">
                      {r.politician_name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{r.politician_name}</p>
                      <p className="text-xs text-white/30">
                        {r.total} servidor{r.total !== 1 ? 'es' : ''}
                        {vereadorServidor && <span> · Salário: <span className="text-green font-medium">{fmt(vereadorServidor.liquido)}</span></span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-white/25">Total gabinete</p>
                      <p className="text-sm font-bold text-white tabular-nums">{fmt(totalLiquido)}</p>
                    </div>
                    <span className={`text-white/20 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="border-t border-white/[0.04] px-4 py-3 space-y-2">
                        {r.servidores.length === 0 ? (
                          <p className="text-xs text-white/25 py-3">Nenhum servidor encontrado para este período.</p>
                        ) : r.servidores.map(s => {
                          const sKey = `${r.politician_id}-${s.matricula}`;
                          const sOpen = expandedServidor === sKey;
                          return (
                            <div key={sKey} className="border border-white/[0.05] rounded-lg overflow-hidden">
                              <button onClick={() => setExpandedServidor(sOpen ? null : sKey)}
                                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.02] transition-colors text-left">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white/80 truncate">{s.nome}</p>
                                  <p className="text-[11px] text-white/25">{s.cargo} · {s.lotacao}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="text-right">
                                    <p className="text-[10px] text-white/20">Líquido</p>
                                    <p className="text-sm font-bold text-green tabular-nums">{fmt(s.liquido)}</p>
                                  </div>
                                  <span className={`text-[10px] text-white/15 transition-transform ${sOpen ? 'rotate-180' : ''}`}>▼</span>
                                </div>
                              </button>

                              <AnimatePresence>
                                {sOpen && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="border-t border-white/[0.04] px-3 py-3 bg-white/[0.01]">
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                        <div><p className="text-[10px] text-white/25">Base</p><p className="text-sm font-medium text-white/70 tabular-nums">{fmt(s.salarioBase)}</p></div>
                                        <div><p className="text-[10px] text-white/25">Proventos</p><p className="text-sm font-medium text-green tabular-nums">{fmt(s.proventos)}</p></div>
                                        <div><p className="text-[10px] text-white/25">Descontos</p><p className="text-sm font-medium text-red tabular-nums">{fmt(s.descontos)}</p></div>
                                        <div><p className="text-[10px] text-white/25">Líquido</p><p className="text-sm font-bold text-white tabular-nums">{fmt(s.liquido)}</p></div>
                                      </div>
                                      {s.eventos.length > 0 && (
                                        <div>
                                          <p className="text-[10px] text-white/20 uppercase tracking-wide mb-2">Rubricas</p>
                                          <div className="space-y-1">
                                            {s.eventos.map((e, i) => (
                                              <div key={i} className="flex justify-between text-xs py-1 border-b border-white/[0.03] last:border-0">
                                                <span className="text-white/40 truncate mr-3">{e.evento}</span>
                                                <span className={`font-medium tabular-nums shrink-0 ${e.tipo === 1 ? 'text-green' : 'text-red'}`}>
                                                  {e.tipo === 1 ? '+' : '-'}{fmt(e.provento || e.desconto)}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      <div className="flex gap-4 mt-3 text-[10px] text-white/15">
                                        <span>Matrícula: {s.matricula}</span>
                                        <span>Vínculo: {s.vinculo}</span>
                                        <span>Situação: {s.situacao}</span>
                                      </div>
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
        </motion.div>
      )}

      <div className="text-center text-[10px] text-white/15 pt-2">
        Fonte: Portal de Transparência — Câmara Municipal de Palmas
      </div>
    </div>
  );
}
