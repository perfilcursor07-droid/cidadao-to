import { PromiseItem, statusLabels } from '../../types/promise';
import PromiseProgress from './PromiseProgress';

interface Props {
  promise: PromiseItem;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-gold/10 text-gold border-gold/20',
  progress: 'bg-blue/10 text-blue border-blue/20',
  done: 'bg-green/10 text-green border-green/20',
  failed: 'bg-red/10 text-red border-red/20',
};

const sourceIcons: Record<string, string> = {
  noticia: '📰',
  rede_social: '📱',
  plano_governo: '📋',
  site_oficial: '🌐',
  entrevista: '🎤',
  debate: '🗣️',
  diario_oficial: '📜',
};

function parseSource(raw: string | null): { url: string; type: string; title: string; source: string } | null {
  if (!raw) return null;

  // Tenta parse JSON (pode estar double-encoded)
  let data: any = null;
  try {
    data = JSON.parse(raw);
    // Se o resultado ainda é string, tenta de novo (double-encoded)
    if (typeof data === 'string') data = JSON.parse(data);
  } catch {}

  if (data && typeof data === 'object') {
    return {
      url: data.url || '',
      type: data.type || '',
      title: data.title || data.source || '',
      source: data.source || '',
    };
  }

  // Fallback: URL direta
  if (raw.startsWith('http')) return { url: raw, type: 'noticia', title: '', source: '' };
  return null;
}

export default function PromiseCard({ promise }: Props) {
  const source = parseSource(promise.source_url);

  return (
    <div className="bg-white border border-border rounded-xl p-4 hover:shadow-card transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {promise.politician && (
              <span className="text-[10px] font-medium text-ink2">{promise.politician.name}</span>
            )}
            {promise.area && (
              <span className="text-[9px] bg-surface text-muted px-1.5 py-0.5 rounded">{promise.area}</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-ink leading-snug">{promise.title}</h3>
          {promise.description && (
            <p className="text-xs text-muted mt-1 leading-relaxed">{promise.description}</p>
          )}
        </div>
        <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${statusStyles[promise.status]}`}>
          {statusLabels[promise.status]}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-3">
        <PromiseProgress progress={promise.progress_pct} status={promise.status} />
      </div>

      {/* Fonte */}
      {source && source.url && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs">{sourceIcons[source.type] || '🔗'}</span>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue hover:text-blue-light hover:underline truncate flex-1 min-w-0"
              title={source.url}
            >
              {source.title || source.source || 'Ver fonte'}
            </a>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] bg-blue/10 text-blue px-2 py-1 rounded-md hover:bg-blue/20 transition-colors shrink-0 font-medium"
            >
              Abrir fonte ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
