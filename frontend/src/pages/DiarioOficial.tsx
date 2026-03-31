import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { getAnalyses, getAnalysis, DiarioAnalysis } from '../services/diario';
import AnalysisResult from '../components/diario/AnalysisResult';
import DiarioChat from '../components/diario/DiarioChat';

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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-card transition-shadow"
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 hover:bg-surface/50 transition-colors"
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
                  <span key={i} className="bg-blue/10 text-blue text-[10px] font-medium px-2 py-0.5 rounded-full">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted text-xs mt-0.5 shrink-0"
          >
            ▼
          </motion.span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 py-4">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted py-4">
                  <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
                  Carregando análise completa...
                </div>
              ) : full ? (
                <AnalysisResult data={{
                  summary: full.summary ?? undefined,
                  ...((full.items as any) || {}),
                  alerts: full.alerts ?? undefined,
                  keywords: full.keywords ?? undefined,
                }} />
              ) : (
                <p className="text-sm text-muted">Erro ao carregar análise.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [.22,1,.36,1] } },
};

export default function DiarioOficial() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['diario-analyses'],
    queryFn: getAnalyses,
  });

  return (
    <div className="space-y-5">
      {/* Header compacto */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue via-blue-light to-accent px-5 py-4 text-white"
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\'%3E%3Cpath d=\'M20 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z\'/%3E%3C/g%3E%3C/svg%3E")',
        }} />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              📜 Diário Oficial do Tocantins
            </h1>
            <p className="text-xs text-white/70 mt-0.5">
              Baixado automaticamente às 08h · Simplificado por IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-white/15 backdrop-blur border border-white/20 rounded-md px-2.5 py-1">
              🕐 Atualização diária às 08h
            </span>
          </div>
        </div>
      </motion.div>

      {/* Como funciona — mais compacto */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { emoji: '📥', title: 'Download automático', desc: 'PDF do DOE-TO baixado diariamente' },
          { emoji: '🤖', title: 'IA processa', desc: 'DeepSeek simplifica a linguagem' },
          { emoji: '🔔', title: 'Alertas e resumo', desc: 'O que importa, de forma simples' },
        ].map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="bg-white border border-border rounded-lg p-3 text-center hover:shadow-card transition-shadow"
          >
            <div className="text-xl mb-1">{c.emoji}</div>
            <h3 className="text-xs font-bold text-ink">{c.title}</h3>
            <p className="text-[10px] text-muted mt-0.5">{c.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Lista de edições */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted py-6">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
          Carregando edições analisadas...
        </div>
      ) : analyses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-border rounded-xl p-8 text-center"
        >
          <div className="text-3xl mb-3">📭</div>
          <h3 className="text-sm font-bold text-ink mb-1">Nenhuma edição analisada ainda</h3>
          <p className="text-xs text-muted">
            As edições são baixadas e analisadas automaticamente pelo administrador.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <motion.h2 variants={fadeUp} className="text-sm font-bold text-ink2">
            {analyses.length} edição{analyses.length > 1 ? 'ões' : ''} analisada{analyses.length > 1 ? 's' : ''}
          </motion.h2>
          {analyses.map(a => (
            <motion.div key={a.id} variants={fadeUp}>
              <EditionCard
                analysis={a}
                expanded={expandedId === a.id}
                onToggle={() => setExpandedId(prev => (prev === a.id ? null : a.id))}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Chat flutuante */}
      <DiarioChat />
    </div>
  );
}
