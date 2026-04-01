import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const roleLabels: Record<string, string> = {
  governador: 'Governador',
  senador: 'Senador',
  dep_federal: 'Dep. Federal',
  dep_estadual: 'Dep. Estadual',
  prefeito: 'Prefeito',
  vereador: 'Vereador',
};

const confidenceBadge: Record<string, { bg: string; label: string; icon: string }> = {
  alta: { bg: 'bg-red-50 text-red-700 border-red-200', label: 'Alta', icon: '🔴' },
  media: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Média', icon: '🟡' },
  baixa: { bg: 'bg-gray-50 text-gray-500 border-gray-200', label: 'Baixa', icon: '⚪' },
};

const statusBadge: Record<string, { bg: string; label: string }> = {
  confirmado: { bg: 'bg-red-50 text-red-600', label: 'Confirmado' },
  suspeita: { bg: 'bg-amber-50 text-amber-600', label: 'Suspeita' },
};

interface Relative {
  id: number;
  name: string;
  role: string | null;
  relationship: string | null;
  institution: string | null;
  evidence: string | null;
  confidence: string;
  status: string;
  source_url: string | null;
  source_title: string | null;
}

interface PoliticianTree {
  politician: {
    id: number;
    name: string;
    role: string;
    party: string | null;
    photo_url: string | null;
    city: string | null;
  };
  relatives: Relative[];
}

export default function VinculosPoliticos() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('todos');

  const { data: trees = [], isLoading } = useQuery<PoliticianTree[]>({
    queryKey: ['vinculos-tree'],
    queryFn: () => api.get('/nepotism/tree').then(r => r.data),
  });

  const filtered = filter === 'todos'
    ? trees
    : trees.filter(t => t.relatives.some(r => r.confidence === filter));

  const totalAlertas = trees.reduce((s, t) => s + t.relatives.length, 0);
  const totalAlta = trees.reduce((s, t) => s + t.relatives.filter(r => r.confidence === 'alta').length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">
          🔗 Vínculos Políticos
        </h1>
        <p className="text-sm text-ink2 mt-1">
          Mapeamento de parentes e indicados em cargos comissionados e de confiança no governo
        </p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-bold">Como funciona:</span> Cruzamos sobrenomes de políticos com nomeações do Diário Oficial,
          buscamos notícias sobre parentesco e usamos IA para classificar a confiança dos indícios.
          Apenas vínculos com evidências reais são exibidos.
        </p>
      </div>

      {/* Stats */}
      {trees.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-border rounded-xl px-4 py-3 text-center">
            <div className="text-xl font-bold text-ink tabular-nums">{trees.length}</div>
            <div className="text-[10px] text-ink2 uppercase tracking-wide">Políticos com vínculos</div>
          </div>
          <div className="bg-white border border-border rounded-xl px-4 py-3 text-center">
            <div className="text-xl font-bold text-amber-600 tabular-nums">{totalAlertas}</div>
            <div className="text-[10px] text-ink2 uppercase tracking-wide">Total de vínculos</div>
          </div>
          <div className="bg-white border border-border rounded-xl px-4 py-3 text-center">
            <div className="text-xl font-bold text-red-600 tabular-nums">{totalAlta}</div>
            <div className="text-[10px] text-ink2 uppercase tracking-wide">Alta confiança</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'alta', label: '🔴 Alta confiança' },
          { key: 'media', label: '🟡 Média' },
          { key: 'baixa', label: '⚪ Baixa' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === f.key
                ? 'bg-green text-white border-green'
                : 'bg-white text-ink2 border-border hover:border-green/30'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-ink2 py-8 justify-center">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" /> Carregando vínculos...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm text-ink2">Nenhum vínculo encontrado</p>
          <p className="text-xs text-muted mt-1">Os dados são atualizados periodicamente pela equipe de análise</p>
        </div>
      )}

      {/* Árvore de vínculos */}
      <div className="space-y-4">
        {filtered.map((tree) => (
          <TreeCard key={tree.politician.id} tree={tree} expanded={expanded === tree.politician.id}
            onToggle={() => setExpanded(expanded === tree.politician.id ? null : tree.politician.id)} />
        ))}
      </div>
    </div>
  );
}

function TreeCard({ tree, expanded, onToggle }: { tree: PoliticianTree; expanded: boolean; onToggle: () => void }) {
  const pol = tree.politician;
  const highConfidence = tree.relatives.filter(r => r.confidence === 'alta').length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Político (raiz da árvore) */}
      <button onClick={onToggle} className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
        {/* Foto */}
        <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-green/20 overflow-hidden shrink-0">
          {pol.photo_url ? (
            <img src={pol.photo_url} alt={pol.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-green font-bold text-lg">
              {pol.name[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-ink">{pol.name}</span>
            {pol.party && <span className="text-[10px] bg-gray-100 text-ink2 px-1.5 py-0.5 rounded font-medium">{pol.party}</span>}
          </div>
          <p className="text-xs text-ink2 mt-0.5">
            {roleLabels[pol.role] || pol.role}
            {pol.city && ` · ${pol.city}`}
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
            {tree.relatives.length} vínculo{tree.relatives.length > 1 ? 's' : ''}
          </span>
          {highConfidence > 0 && (
            <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
              {highConfidence} 🔴
            </span>
          )}
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="text-ink2 text-sm">
            ▼
          </motion.span>
        </div>
      </button>

      {/* Árvore expandida */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-5 pb-5">
              {/* Linha conectora vertical */}
              <div className="relative ml-6 pl-6 border-l-2 border-green/20 space-y-3">
                {tree.relatives.map((rel) => (
                  <RelativeNode key={rel.id} relative={rel} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RelativeNode({ relative }: { relative: Relative }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const conf = confidenceBadge[relative.confidence] || confidenceBadge.baixa;
  const stat = statusBadge[relative.status];

  return (
    <div className="relative">
      {/* Conector horizontal */}
      <div className="absolute -left-6 top-5 w-6 h-px bg-green/20" />
      {/* Nó do parente */}
      <div className="bg-gray-50 border border-border rounded-lg p-3.5 hover:border-green/20 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                {relative.name[0]}
              </span>
              <span className="text-sm font-semibold text-ink">{relative.name}</span>
            </div>
            <div className="ml-9 space-y-1">
              {relative.relationship && (
                <p className="text-xs text-ink2">
                  <span className="text-muted">Parentesco:</span> <span className="font-medium">{relative.relationship}</span>
                </p>
              )}
              {relative.role && (
                <p className="text-xs text-ink2">
                  <span className="text-muted">Cargo:</span> <span className="font-medium">{relative.role}</span>
                </p>
              )}
              {relative.institution && (
                <p className="text-xs text-ink2">
                  <span className="text-muted">Órgão:</span> <span className="font-medium">{relative.institution}</span>
                </p>
              )}
            </div>
          </div>

          {/* Badges de confiança e status */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${conf.bg}`}>
              {conf.icon} {conf.label}
            </span>
            {stat && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${stat.bg}`}>
                {stat.label}
              </span>
            )}
          </div>
        </div>

        {/* Evidência expandível */}
        {relative.evidence && (
          <div className="ml-9 mt-2">
            <button onClick={() => setShowEvidence(!showEvidence)}
              className="text-[11px] text-green hover:underline font-medium">
              {showEvidence ? '▲ Ocultar evidência' : '▼ Ver evidência'}
            </button>
            <AnimatePresence>
              {showEvidence && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <p className="text-xs text-ink2 mt-1.5 leading-relaxed bg-white border border-border rounded-md p-2.5">
                    {relative.evidence}
                  </p>
                  {relative.source_url && (
                    <a href={relative.source_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-1.5">
                      📰 {relative.source_title || 'Ver fonte'} ↗
                    </a>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
