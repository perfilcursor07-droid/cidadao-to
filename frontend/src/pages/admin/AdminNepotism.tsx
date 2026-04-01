import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

const confidenceColors: Record<string, string> = {
  alta: 'bg-red/15 text-red border-red/20',
  media: 'bg-gold/15 text-gold border-gold/20',
  baixa: 'bg-white/[0.04] text-white/40 border-white/[0.06]',
};
const statusColors: Record<string, string> = {
  confirmado: 'bg-red/15 text-red',
  suspeita: 'bg-gold/15 text-gold',
  descartado: 'bg-white/[0.04] text-white/30',
};

export default function AdminNepotism() {
  const qc = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState('');

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['admin-nepotism'],
    queryFn: () => api.get('/admin/nepotism').then(r => r.data),
  });

  const handleAnalyzeAll = async () => {
    setAnalyzing(true);
    setStatus('🔍 Analisando todos os políticos...');
    try {
      await api.post('/admin/nepotism/analyze-all');
      setStatus('✅ Análise iniciada em background. Recarregue em alguns minutos.');
      setTimeout(() => qc.invalidateQueries({ queryKey: ['admin-nepotism'] }), 10000);
    } catch (err: any) { setStatus(`❌ ${err?.response?.data?.error || 'Erro'}`); }
    setAnalyzing(false);
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/admin/nepotism/${id}`);
    qc.invalidateQueries({ queryKey: ['admin-nepotism'] });
  };

  const alta = alerts.filter((a: any) => a.confidence === 'alta').length;
  const media = alerts.filter((a: any) => a.confidence === 'media').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Detector de Nepotismo</h1>
          <p className="text-sm text-white/40 mt-0.5">Cruza sobrenomes com nomeações do D.O. e notícias</p>
        </div>
        <button onClick={handleAnalyzeAll} disabled={analyzing}
          className="px-4 py-2 bg-red/80 text-white rounded-lg text-sm font-medium hover:bg-red transition-colors disabled:opacity-40 flex items-center gap-2">
          {analyzing ? <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Analisando...</> : '🤖 Analisar todos'}
        </button>
      </div>

      {/* Quick stats */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.02] border border-red/10 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-red tabular-nums">{alta}</div>
            <div className="text-[9px] text-white/25 uppercase">Alta confiança</div>
          </div>
          <div className="bg-white/[0.02] border border-gold/10 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-gold tabular-nums">{media}</div>
            <div className="text-[9px] text-white/25 uppercase">Média</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-white/40 tabular-nums">{alerts.length}</div>
            <div className="text-[9px] text-white/25 uppercase">Total alertas</div>
          </div>
        </div>
      )}

      {/* Como funciona */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Como funciona</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><span className="text-lg">📰</span><p className="text-[10px] text-white/30 mt-1">Cruza sobrenomes com nomeações do D.O.</p></div>
          <div><span className="text-lg">🔎</span><p className="text-[10px] text-white/30 mt-1">Busca notícias sobre parentesco</p></div>
          <div><span className="text-lg">🤖</span><p className="text-[10px] text-white/30 mt-1">IA classifica a confiança</p></div>
        </div>
      </motion.div>

      {status && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="text-sm px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/60">
          {status}
        </motion.div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-white/30 py-6">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" /> Carregando...
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm text-white/40">Nenhum alerta de nepotismo</p>
          <p className="text-xs text-white/20 mt-1">Clique em "Analisar todos" para verificar</p>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2.5">
          <h2 className="text-sm font-bold text-white/70">{alerts.length} alerta{alerts.length > 1 ? 's' : ''}</h2>
          {alerts.map((a: any) => (
            <motion.div key={a.id} variants={fadeUp}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${confidenceColors[a.confidence]}`}>
                      {a.confidence === 'alta' ? '🔴 Alta' : a.confidence === 'media' ? '🟡 Média' : '⚪ Baixa'}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${statusColors[a.status]}`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 font-medium">
                    {a.politician?.name} → {a.relative_name}
                  </p>
                  <div className="text-xs text-white/35 mt-1.5 space-y-0.5">
                    {a.relationship && <p>Relação: <span className="text-white/55">{a.relationship}</span></p>}
                    {a.relative_role && <p>Cargo: <span className="text-white/55">{a.relative_role}</span></p>}
                    {a.institution && <p>Órgão: <span className="text-white/55">{a.institution}</span></p>}
                  </div>
                  {a.evidence && <p className="text-xs text-white/25 mt-2 leading-relaxed">{a.evidence}</p>}
                  {a.source_url && (
                    <a href={a.source_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue hover:underline mt-2">
                      📰 {a.source_title || 'Ver fonte'} ↗
                    </a>
                  )}
                </div>
                <button onClick={() => handleDelete(a.id)} className="text-white/15 hover:text-red text-xs transition-colors shrink-0">🗑️</button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
