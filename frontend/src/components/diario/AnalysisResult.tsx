import { useState } from 'react';

interface Entry { name: string; detail: string }
interface Category { name: string; icon: string; count: number; description: string; entries: Entry[] }
interface Highlight { title: string; description: string; impact: string; detail?: string }

interface Props {
  data: {
    summary?: string;
    impact?: string;
    impact_reason?: string;
    categories?: Category[];
    highlights?: Highlight[];
    alerts?: string[];
    keywords?: string[];
    items?: any[];
    stats?: any;
  };
}

const impactCfg: Record<string, { icon: string; label: string; color: string; bg: string; bar: string; pct: string }> = {
  positivo: { icon: '👍', label: 'Positivo', color: 'text-green', bg: 'bg-green/5 border-green/15', bar: 'bg-green', pct: '75%' },
  negativo: { icon: '👎', label: 'Negativo', color: 'text-red', bg: 'bg-red/5 border-red/15', bar: 'bg-red', pct: '30%' },
  neutro: { icon: '📄', label: 'Administrativo', color: 'text-muted', bg: 'bg-surface border-border', bar: 'bg-gray-300', pct: '50%' },
};

const catStyle: Record<string, { emoji: string; bg: string; text: string }> = {
  'Nomeações': { emoji: '👤', bg: 'bg-blue/5', text: 'text-blue' },
  'Exonerações': { emoji: '🚪', bg: 'bg-red/5', text: 'text-red' },
  'Designações': { emoji: '📝', bg: 'bg-accent/5', text: 'text-accent' },
  'Dispensas': { emoji: '✋', bg: 'bg-gold/5', text: 'text-gold' },
  'Contratos': { emoji: '📑', bg: 'bg-green/5', text: 'text-green' },
  'Contratos Extintos': { emoji: '📄', bg: 'bg-red/5', text: 'text-red' },
  'Licitações': { emoji: '🏗️', bg: 'bg-green/5', text: 'text-green' },
  'Decretos': { emoji: '📜', bg: 'bg-accent/5', text: 'text-accent' },
  'Portarias': { emoji: '📋', bg: 'bg-gray-50', text: 'text-ink2' },
  'Reajustes Salariais': { emoji: '💰', bg: 'bg-green/5', text: 'text-green' },
  'Convênios': { emoji: '🤝', bg: 'bg-blue/5', text: 'text-blue' },
};

function getCat(name: string) {
  return catStyle[name] || { emoji: '📌', bg: 'bg-gray-50', text: 'text-ink2' };
}

export default function AnalysisResult({ data }: Props) {
  const imp = impactCfg[data.impact || 'neutro'];
  const cats = data.categories || [];
  const highlights = data.highlights || [];
  const totalItems = cats.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-5">

      {/* Resumo + Impacto inline */}
      <div className={`rounded-xl border p-4 ${imp.bg}`}>
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">{imp.icon}</span>
          <div className="flex-1 min-w-0">
            {data.summary && <p className="text-sm text-ink leading-relaxed">{data.summary}</p>}
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-[10px] font-bold ${imp.color}`}>{imp.label}</span>
              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                <div className={`h-full rounded-full ${imp.bar}`} style={{ width: imp.pct }} />
              </div>
              {data.impact_reason && <span className="text-[10px] text-muted">{data.impact_reason}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Números rápidos */}
      {cats.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-muted font-medium">{totalItems} publicações em {cats.length} categorias:</span>
          {cats.map((c, i) => {
            const s = getCat(c.name);
            return (
              <span key={i} className="flex items-center gap-1 text-xs">
                <span>{s.emoji}</span>
                <span className={`font-bold tabular-nums ${s.text}`}>{c.count}</span>
                <span className="text-muted">{c.name}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Categorias expandíveis */}
      {cats.length > 0 && (
        <div className="space-y-2">
          {cats.map((cat, i) => <CategoryRow key={i} category={cat} />)}
        </div>
      )}

      {/* Destaques */}
      {highlights.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-ink mb-2">🔔 Destaques para o cidadão</h3>
          <div className="space-y-2">
            {highlights.map((h, i) => <HighlightRow key={i} highlight={h} />)}
          </div>
        </div>
      )}

      {/* Alertas */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="bg-red/5 border border-red/15 rounded-xl p-4">
          <h3 className="text-xs font-bold text-red mb-2">⚠️ Fique atento</h3>
          <ul className="space-y-1">
            {data.alerts.map((a, i) => <li key={i} className="text-xs text-ink2 flex gap-2"><span className="text-red shrink-0">•</span>{a}</li>)}
          </ul>
        </div>
      )}

      {/* Keywords */}
      {data.keywords && data.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.keywords.map((kw, i) => (
            <span key={i} className="bg-blue/8 text-blue text-[10px] font-medium px-2 py-0.5 rounded-full">{kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* Categoria como linha expandível */
function CategoryRow({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const s = getCat(category.name);
  const hasEntries = category.entries && category.entries.length > 0;

  return (
    <div className={`rounded-xl border border-border overflow-hidden ${open ? 'shadow-sm' : ''}`}>
      <button
        onClick={() => hasEntries && setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${hasEntries ? 'hover:bg-surface cursor-pointer' : 'cursor-default'}`}
      >
        <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
          <span className="text-base">{s.emoji}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-bold tabular-nums ${s.text}`}>{category.count}</span>
            <span className="text-sm font-medium text-ink">{category.name}</span>
          </div>
          <p className="text-[11px] text-muted truncate">{category.description}</p>
        </div>
        {hasEntries && (
          <span className="text-xs text-muted shrink-0">{open ? '▲' : '▼'}</span>
        )}
      </button>
      {open && hasEntries && (
        <div className="border-t border-border bg-surface max-h-[250px] overflow-y-auto">
          {category.entries.map((e, i) => (
            <div key={i} className="flex items-start gap-2 px-4 py-2 border-b border-border last:border-0">
              <span className="text-[10px] text-muted mt-0.5 shrink-0 tabular-nums w-5">{i + 1}.</span>
              <div className="min-w-0">
                <span className="text-xs font-medium text-ink">{e.name}</span>
                {e.detail && <p className="text-[11px] text-muted mt-0.5">{e.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Destaque expandível */
function HighlightRow({ highlight }: { highlight: Highlight }) {
  const [open, setOpen] = useState(false);
  const imp = impactCfg[highlight.impact || 'neutro'];

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 hover:bg-surface transition-colors">
        <div className="flex items-start gap-3">
          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${imp.bar}`} />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-ink">{highlight.title}</h4>
            <p className="text-[11px] text-muted mt-0.5">{highlight.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[9px] font-bold ${imp.color}`}>{imp.label}</span>
            <span className="text-[10px] text-muted">{open ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>
      {open && highlight.detail && (
        <div className="border-t border-border px-4 py-3 bg-surface">
          <p className="text-xs text-ink2 leading-relaxed">{highlight.detail}</p>
        </div>
      )}
    </div>
  );
}
