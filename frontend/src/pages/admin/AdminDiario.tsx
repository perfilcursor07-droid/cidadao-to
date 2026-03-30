import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminDiarios, adminFetchDiario, adminDeleteDiario } from '../../services/admin';
import { getAnalysis, DiarioAnalysis } from '../../services/diario';
import AnalysisResult from '../../components/diario/AnalysisResult';

function formatDate(d: string | null) {
  if (!d) return '—';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

export default function AdminDiario() {
  const qc = useQueryClient();
  const [date, setDate] = useState('');
  const [fetching, setFetching] = useState(false);
  const [status, setStatus] = useState<{ msg: string; ok: boolean | null }>({ msg: '', ok: null });
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
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
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
      </div>

      {/* Lista */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3">
          {isLoading ? 'Carregando...' : `${diarios.length} edições analisadas`}
        </h2>
        <div className="space-y-2">
          {diarios.map((d: DiarioAnalysis) => (
            <DiarioRow
              key={d.id}
              d={d}
              expanded={expandedId === d.id}
              onToggle={() => setExpandedId(prev => prev === d.id ? null : d.id)}
              onDelete={() => handleDelete(d.id)}
              deleting={deleting === d.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DiarioRow({ d, expanded, onToggle, onDelete, deleting }: {
  d: DiarioAnalysis; expanded: boolean; onToggle: () => void; onDelete: () => void; deleting: boolean;
}) {
  const { data: full, isLoading } = useQuery({
    queryKey: ['diario', d.id],
    queryFn: () => getAnalysis(d.id),
    enabled: expanded,
  });

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onToggle} className="flex-1 text-left flex items-center gap-3">
          <span className="text-xs font-bold text-white/70 bg-white/5 px-2 py-0.5 rounded">
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
            <div className="[&_*]:!text-white/70 [&_h3]:!text-white/90">
              <AnalysisResult data={{
                summary: full.summary ?? undefined,
                items: full.items ?? undefined,
                alerts: full.alerts ?? undefined,
                keywords: full.keywords ?? undefined,
              }} />
            </div>
          ) : <p className="text-sm text-white/30">Erro ao carregar.</p>}
        </div>
      )}
    </div>
  );
}
