import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnalyses, getAnalysis, DiarioAnalysis } from '../services/diario';
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

export default function DiarioOficial() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['diario-analyses'],
    queryFn: getAnalyses,
  });

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
          <p className="text-xs text-muted">
            As edições são baixadas e analisadas automaticamente pelo administrador.
          </p>
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
