import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getAdminDiarios, adminFetchDiario, adminFetchDiarioBulk, adminDeleteDiario } from '../../services/admin';
import { getAnalysis, DiarioAnalysis } from '../../services/diario';

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

function formatDate(d: string | null) {
  if (!d) return '—';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

export default function AdminDiario() {
  const qc = useQueryClient();
  const [date, setDate] = useState('');
  const [fetching, setFetching] = useState(false);
  const [bulkFetching, setBulkFetching] = useState(false);
  const [status, setStatus] = useState<{ msg: string; ok: boolean | null }>({ msg: '', ok: null });
  const [bulkStatus, setBulkStatus] = useState<{ msg: string; ok: boolean | null }>({ msg: '', ok: null });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: diarios = [], isLoading } = useQuery({
    queryKey: ['admin-diarios'],
    queryFn: getAdminDiarios,
  });

  const handleFetch = async () => {
    if (!date) return;
    setFetching(true);
    setStatus({ msg: `Baixando Diário de ${formatDate(date)}...`, ok: null });
    try {
      const result = await adminFetchDiario(date);
      setStatus({ msg: result.message, ok: result.success });
      if (result.success) qc.invalidateQueries({ queryKey: ['admin-diarios'] });
    } catch (err: any) {
      setStatus({ msg: err?.response?.data?.message || err?.response?.data?.error || 'Erro', ok: false });
    } finally {
      setFetching(false);
    }
  };

  const handleBulkFetch = async () => {
    setBulkFetching(true);
    setBulkStatus({ msg: 'Buscando e analisando últimas 10 edições... Isso pode levar alguns minutos.', ok: null });
    try {
      const result = await adminFetchDiarioBulk(10);
      const msg = `Concluído: ${result.success} novas, ${result.skipped} já existentes, ${result.failed} falhas`;
      setBulkStatus({ msg, ok: result.failed === 0 });
      qc.invalidateQueries({ queryKey: ['admin-diarios'] });
    } catch (err: any) {
      setBulkStatus({ msg: err?.response?.data?.message || 'Erro ao baixar em lote', ok: false });
    } finally {
      setBulkFetching(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover esta análise?')) return;
    setDeleting(id);
    try {
      await adminDeleteDiario(id);
      qc.invalidateQueries({ queryKey: ['admin-diarios'] });
    } catch {}
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Diário Oficial</h1>
        <p className="text-sm text-white/40 mt-0.5">Baixe e gerencie edições do DOE-TO</p>
      </div>

      {/* Fetch card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-3">📥 Baixar edição por data</h2>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-[11px] text-white/40 mb-1">Data da edição</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green/50"
            />
          </div>
          <button
            onClick={handleFetch}
            disabled={fetching || !date}
            className="px-5 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {fetching ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Processando...
              </>
            ) : 'Baixar e analisar'}
          </button>
          <button
            onClick={handleBulkFetch}
            disabled={bulkFetching || fetching}
            className="px-5 py-2 bg-blue text-white rounded-lg text-sm font-medium hover:bg-blue-light transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {bulkFetching ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Baixando...
              </>
            ) : '📦 Baixar últimos 10'}
          </button>
        </div>
        {status.msg && (
          <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${
            status.ok === true ? 'bg-green/10 text-green border border-green/20' :
            status.ok === false ? 'bg-red/10 text-red border border-red/20' :
            'bg-blue/10 text-blue border border-blue/20'
          }`}>
            {status.ok === true ? '✅' : status.ok === false ? '❌' : '⏳'} {status.msg}
          </div>
        )}
        {bulkStatus.msg && (
          <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${
            bulkStatus.ok === true ? 'bg-green/10 text-green border border-green/20' :
            bulkStatus.ok === false ? 'bg-red/10 text-red border border-red/20' :
            'bg-blue/10 text-blue border border-blue/20'
          }`}>
            {bulkStatus.ok === true ? '✅' : bulkStatus.ok === false ? '❌' : '⏳'} {bulkStatus.msg}
          </div>
        )}
      </motion.div>

      {/* Lista */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3">
          {isLoading ? 'Carregando...' : `${diarios.length} edições analisadas`}
        </h2>
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
          {diarios.map((d: DiarioAnalysis) => (
            <motion.div key={d.id} variants={fadeUp}>
              <DiarioRow
                d={d}
                expanded={expandedId === d.id}
                onToggle={() => setExpandedId(prev => prev === d.id ? null : d.id)}
                onDelete={() => handleDelete(d.id)}
                deleting={deleting === d.id}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

const impactCfg: Record<string, { icon: string; label: string; color: string; bar: string; pct: string }> = {
  positivo: { icon: '👍', label: 'Positivo', color: 'text-green', bar: 'bg-green', pct: '75%' },
  negativo: { icon: '👎', label: 'Negativo', color: 'text-red', bar: 'bg-red', pct: '30%' },
  neutro: { icon: '📄', label: 'Administrativo', color: 'text-white/50', bar: 'bg-white/30', pct: '50%' },
};

function DiarioRow({ d, expanded, onToggle, onDelete, deleting }: {
  d: DiarioAnalysis; expanded: boolean; onToggle: () => void; onDelete: () => void; deleting: boolean;
}) {
  const { data: full, isLoading } = useQuery({
    queryKey: ['diario', d.id],
    queryFn: () => getAnalysis(d.id),
    enabled: expanded,
  });

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.1] transition-colors">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onToggle} className="flex-1 text-left flex items-center gap-3">
          <span className="text-xs font-bold text-white/70 bg-white/[0.06] px-2 py-0.5 rounded">
            {formatDate(d.edition_date)}
          </span>
          {d.edition && <span className="text-xs text-white/30">Nº {d.edition}</span>}
          {(d.alerts?.length ?? 0) > 0 && (
            <span className="text-[10px] bg-red/10 text-red px-2 py-0.5 rounded-full font-bold">
              {d.alerts.length} alerta{d.alerts.length > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-white/20 text-xs ml-auto">{expanded ? '▲' : '▼'}</span>
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="ml-3 text-[11px] text-red/50 hover:text-red transition-colors disabled:opacity-30"
        >
          {deleting ? '...' : '🗑️'}
        </button>
      </div>
      {expanded && (
        <div className="border-t border-white/5 px-4 py-4 bg-white/[0.02]">
          {isLoading ? (
            <p className="text-sm text-white/30">Carregando...</p>
          ) : full ? (
            <AdminAnalysisView data={{
              summary: full.summary ?? undefined,
              ...((full.items as any) || {}),
              alerts: full.alerts ?? undefined,
              keywords: full.keywords ?? undefined,
            }} />
          ) : <p className="text-sm text-white/30">Erro ao carregar.</p>}
        </div>
      )}
    </div>
  );
}

/* ── Versão dark-theme do AnalysisResult para o admin ── */
function AdminAnalysisView({ data }: {
  data: {
    summary?: string;
    impact?: string;
    impact_reason?: string;
    categories?: { name: string; icon: string; count: number; description: string; entries: { name: string; detail: string }[] }[];
    highlights?: { title: string; description: string; impact: string; detail?: string }[];
    alerts?: string[];
    keywords?: string[];
  };
}) {
  const imp = impactCfg[data.impact || 'neutro'];
  const cats = data.categories || [];
  const highlights = data.highlights || [];
  const totalItems = cats.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">{imp.icon}</span>
          <div className="flex-1 min-w-0">
            {data.summary && <p className="text-sm text-white/70 leading-relaxed">{data.summary}</p>}
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-[10px] font-bold ${imp.color}`}>{imp.label}</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden max-w-[120px]">
                <div className={`h-full rounded-full ${imp.bar}`} style={{ width: imp.pct }} />
              </div>
              {data.impact_reason && <span className="text-[10px] text-white/40">{data.impact_reason}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Números rápidos */}
      {cats.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-white/40 font-medium">{totalItems} publicações em {cats.length} categorias:</span>
          {cats.map((c, i) => (
            <span key={i} className="flex items-center gap-1 text-xs">
              <span className="font-bold tabular-nums text-white/70">{c.count}</span>
              <span className="text-white/40">{c.name}</span>
            </span>
          ))}
        </div>
      )}

      {/* Categorias */}
      {cats.length > 0 && (
        <div className="space-y-1.5">
          {cats.map((cat, i) => <AdminCategoryRow key={i} category={cat} />)}
        </div>
      )}

      {/* Destaques */}
      {highlights.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-white/60 mb-2">🔔 Destaques para o cidadão</h3>
          <div className="space-y-1.5">
            {highlights.map((h, i) => {
              const hi = impactCfg[h.impact || 'neutro'];
              return (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${hi.bar}`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white/80">{h.title}</h4>
                      <p className="text-[11px] text-white/40 mt-0.5">{h.description}</p>
                      {h.detail && <p className="text-xs text-white/50 mt-1 leading-relaxed">{h.detail}</p>}
                    </div>
                    <span className={`text-[9px] font-bold shrink-0 ${hi.color}`}>{hi.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alertas */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="bg-red/5 border border-red/15 rounded-lg p-4">
          <h3 className="text-xs font-bold text-red mb-2">⚠️ Fique atento</h3>
          <ul className="space-y-1">
            {data.alerts.map((a, i) => <li key={i} className="text-xs text-white/60 flex gap-2"><span className="text-red shrink-0">•</span>{a}</li>)}
          </ul>
        </div>
      )}

      {/* Keywords */}
      {data.keywords && data.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.keywords.map((kw, i) => (
            <span key={i} className="bg-white/[0.06] text-white/50 text-[10px] font-medium px-2 py-0.5 rounded-full">{kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminCategoryRow({ category }: { category: { name: string; count: number; description: string; entries: { name: string; detail: string }[] } }) {
  const [open, setOpen] = useState(false);
  const hasEntries = category.entries && category.entries.length > 0;

  return (
    <div className={`bg-white/[0.03] border border-white/[0.06] rounded-lg overflow-hidden ${open ? 'border-white/[0.1]' : ''}`}>
      <button
        onClick={() => hasEntries && setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${hasEntries ? 'hover:bg-white/[0.03] cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tabular-nums text-white/70">{category.count}</span>
            <span className="text-sm font-medium text-white/80">{category.name}</span>
          </div>
          <p className="text-[11px] text-white/30 truncate">{category.description}</p>
        </div>
        {hasEntries && <span className="text-xs text-white/20 shrink-0">{open ? '▲' : '▼'}</span>}
      </button>
      {open && hasEntries && (
        <div className="border-t border-white/5 bg-white/[0.02] max-h-[250px] overflow-y-auto">
          {category.entries.map((e, i) => (
            <div key={i} className="flex items-start gap-2 px-4 py-2 border-b border-white/5 last:border-0">
              <span className="text-[10px] text-white/20 mt-0.5 shrink-0 tabular-nums w-5">{i + 1}.</span>
              <div className="min-w-0">
                <span className="text-xs font-medium text-white/70">{e.name}</span>
                {e.detail && <p className="text-[11px] text-white/40 mt-0.5">{e.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
