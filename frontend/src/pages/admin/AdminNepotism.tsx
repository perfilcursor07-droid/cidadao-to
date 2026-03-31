import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const confidenceColors: Record<string, string> = {
  alta: 'bg-red/10 text-red border-red/20',
  media: 'bg-gold/10 text-gold border-gold/20',
  baixa: 'bg-gray-100 text-muted border-border',
};

const statusColors: Record<string, string> = {
  confirmado: 'bg-red/10 text-red',
  suspeita: 'bg-gold/10 text-gold',
  descartado: 'bg-gray-100 text-muted',
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
    setStatus('🔍 Analisando todos os políticos... Pode demorar vários minutos.');
    try {
      await api.post('/admin/nepotism/analyze-all');
      setStatus('✅ Análise iniciada em background. Recarregue em alguns minutos.');
      setTimeout(() => qc.invalidateQueries({ queryKey: ['admin-nepotism'] }), 10000);
    } catch (err: any) {
      setStatus(`❌ ${err?.response?.data?.error || 'Erro'}`);
    }
    setAnalyzing(false);
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/admin/nepotism/${id}`);
    qc.invalidateQueries({ queryKey: ['admin-nepotism'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">🔍 Detector de Nepotismo</h1>
          <p className="text-sm text-white/40 mt-0.5">Cruza sobrenomes com nomeações do Diário Oficial e notícias</p>
        </div>
        <button onClick={handleAnalyzeAll} disabled={analyzing}
          className="px-5 py-2 bg-red/80 text-white rounded-lg text-sm font-medium hover:bg-red transition-colors disabled:opacity-40 flex items-center gap-2">
          {analyzing ? <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Analisando...</> : '🤖 Analisar todos'}
        </button>
      </div>

      {status && <div className="text-sm px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white/70">{status}</div>}

      {/* Como funciona */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-xs font-bold text-white/60 mb-2">Como funciona</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><span className="text-lg">📰</span><p className="text-[10px] text-white/40 mt-1">Cruza sobrenomes com nomeações do Diário Oficial</p></div>
          <div><span className="text-lg">🔎</span><p className="text-[10px] text-white/40 mt-1">Busca notícias sobre parentesco e nepotismo</p></div>
          <div><span className="text-lg">🤖</span><p className="text-[10px] text-white/40 mt-1">IA analisa e classifica a confiança da evidência</p></div>
        </div>
      </div>

      {/* Lista de alertas */}
      {isLoading ? (
        <p className="text-sm text-white/30">Carregando...</p>
      ) : alerts.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm text-white/40">Nenhum alerta de nepotismo encontrado</p>
          <p className="text-xs text-white/20 mt-1">Clique em "Analisar todos" para iniciar a verificação</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white">{alerts.length} alerta{alerts.length > 1 ? 's' : ''}</h2>
          {alerts.map((a: any) => (
            <div key={a.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                  <div className="text-xs text-white/40 mt-1 space-y-0.5">
                    {a.relationship && <p>Relação: <span className="text-white/60">{a.relationship}</span></p>}
                    {a.relative_role && <p>Cargo: <span className="text-white/60">{a.relative_role}</span></p>}
                    {a.institution && <p>Órgão: <span className="text-white/60">{a.institution}</span></p>}
                  </div>
                  {a.evidence && <p className="text-xs text-white/30 mt-2 leading-relaxed">{a.evidence}</p>}
                  {a.source_url && (
                    <a href={a.source_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue hover:underline mt-2">
                      📰 {a.source_title || 'Ver fonte'} ↗
                    </a>
                  )}
                </div>
                <button onClick={() => handleDelete(a.id)} className="text-white/20 hover:text-red text-xs transition-colors">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
