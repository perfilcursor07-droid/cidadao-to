import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAnalyses, getAnalysis, triggerFetchSync, DiarioAnalysis } from '../services/diario';
import AnalysisResult from '../components/diario/AnalysisResult';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function AlertsBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-red/10 text-red text-[10px] font-bold px-2 py-0.5 rounded-full">
      {count} alerta{count > 1 ? 's' : ''}
    </span>
  );
}

function EditionCard({
  analysis,
  expanded,
  onToggle,
}: {
  analysis: DiarioAnalysis;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { data: full, isLoading } = useQuery({
    queryKey: ['diario', analysis.id],
    queryFn: () => getAnalysis(analysis.id),
    enabled: expanded,
  });

  const alerts = analysis.alerts || [];
  const keywords = (analysis.keywords || []).slice(0, 5);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      {/* Header do card */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 hover:bg-surface transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold text-ink2 bg-surface px-2 py-0.5 rounded">
                {formatDate(analysis.edition_date)}
              </span>
              {analysis.edition && (
                <span className="text-xs text-muted">Edição Nº {analysis.edition}</span>
              )}
              <AlertsBadge count={alerts.length} />
            </div>
            <p className="text-sm text-ink leading-snug line-clamp-2">
              {analysis.summary || 'Resumo não disponível.'}
            </p>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="bg-blue/10 text-blue text-[10px] font-medium px-2 py-0.5 rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className="text-muted text-xs mt-0.5 shrink-0">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Conteúdo expandido */}
      {expanded && (
        <div className="border-t border-border px-5 py-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted py-4">
              <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
              Carregando análise completa...
            </div>
          ) : full ? (
            <AnalysisResult data={{
              summary: full.summary ?? undefined,
              items: full.items ?? undefined,
              alerts: full.alerts ?? undefined,
              keywords: full.keywords ?? undefined,
            }} />
          ) : (
            <p className="text-sm text-muted">Erro ao carregar análise.</p>
          )}
        </div>
      )}
    </div>
  );
}

function FetchStatus({ message, success }: { message: string; success: boolean | null }) {
  if (!message) return null;
  return (
    <div
      className={`rounded-lg px-4 py-3 text-sm flex items-start gap-2 ${
        success === true
          ? 'bg-green/5 border border-green/20 text-green'
          : success === false
          ? 'bg-red/5 border border-red/20 text-red'
          : 'bg-blue/5 border border-blue/20 text-blue'
      }`}
    >
      <span>{success === true ? '✅' : success === false ? '❌' : '⏳'}</span>
      <span>{message}</span>
    </div>
  );
}

export default function DiarioOficial() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<{ message: string; success: boolean | null }>({
    message: '',
    success: null,
  });

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['diario-analyses'],
    queryFn: getAnalyses,
    refetchInterval: fetching ? 5000 : false,
  });

  const handleFetch = async (date?: string) => {
    setFetching(true);
    setFetchStatus({ message: `Baixando Diário Oficial${date ? ` de ${formatDate(date)}` : ' de hoje'}...`, success: null });

    try {
      const result = await triggerFetchSync(date);
      setFetchStatus({ message: result.message, success: result.success });
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ['diario-analyses'] });
        if (result.id) setExpandedId(result.id);
      }
    } catch (err: any) {
      setFetchStatus({
        message: err?.response?.data?.message || err.message || 'Erro ao conectar ao servidor.',
        success: false,
      });
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-ink flex items-center gap-2">
              Diário Oficial do Tocantins
            </h1>
            <p className="text-sm text-muted mt-0.5">
              Baixado automaticamente todos os dias às 08h e simplificado por IA para linguagem clara e objetiva.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted bg-surface border border-border rounded px-2 py-1">
              Atualização automática: todos os dias às 08h
            </span>
          </div>
        </div>

        {/* Como funciona */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { emoji: '📥', title: 'Download automático', desc: 'O sistema baixa o PDF do DOE-TO diariamente' },
            { emoji: '🤖', title: 'IA processa', desc: 'DeepSeek lê e simplifica a linguagem burocrática' },
            { emoji: '🔔', title: 'Alertas e resumo', desc: 'Você recebe o que importa de forma simples' },
          ].map(c => (
            <div key={c.title} className="bg-surface border border-border rounded-lg p-3 text-center">
              <div className="text-xl mb-1">{c.emoji}</div>
              <h3 className="text-xs font-bold text-ink">{c.title}</h3>
              <p className="text-[11px] text-muted mt-0.5">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => handleFetch()}
          disabled={fetching}
          className="px-4 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {fetching ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Processando...
            </>
          ) : (
            '📥 Baixar edição de hoje'
          )}
        </button>

        <button
          onClick={() => handleFetch('2026-03-27')}
          disabled={fetching}
          className="px-4 py-2 border border-border text-ink2 rounded-lg text-sm font-medium hover:bg-surface transition-colors disabled:opacity-50"
        >
          Baixar edição 27/03/2026
        </button>
      </div>

      {/* Status do fetch */}
      <FetchStatus message={fetchStatus.message} success={fetchStatus.success} />

      {/* Lista de edições */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted py-6">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
          Carregando edições analisadas...
        </div>
      ) : analyses.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-8 text-center">
          <div className="text-3xl mb-3">📭</div>
          <h3 className="text-sm font-bold text-ink mb-1">Nenhuma edição analisada ainda</h3>
          <p className="text-xs text-muted mb-4">
            Clique em "Baixar edição 27/03/2026" para ver como funciona.
          </p>
          <button
            onClick={() => handleFetch('2026-03-27')}
            disabled={fetching}
            className="px-4 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors disabled:opacity-50"
          >
            {fetching ? 'Processando...' : 'Baixar primeira edição'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-ink2">{analyses.length} edição{analyses.length > 1 ? 'ões' : ''} analisada{analyses.length > 1 ? 's' : ''}</h2>
          {analyses.map(a => (
            <EditionCard
              key={a.id}
              analysis={a}
              expanded={expandedId === a.id}
              onToggle={() => setExpandedId(prev => (prev === a.id ? null : a.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
