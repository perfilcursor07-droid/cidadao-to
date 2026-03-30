import { usePoliticians } from '../../hooks/usePoliticians';
import { formatScore } from '../../utils/formatters';
import { getScoreColor } from '../../utils/scoreHelpers';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  const { data: politicians } = usePoliticians();
  const top5 = politicians?.slice(0, 5) || [];

  return (
    <aside className="space-y-5">
      {/* Ranking */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="bg-green px-4 py-2.5">
          <h3 className="text-sm font-bold text-white">Ranking de Aprovação</h3>
        </div>
        <div className="divide-y divide-border">
          {top5.map((p, i) => (
            <Link
              key={p.id}
              to={`/politicians/${p.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                i === 0 ? 'bg-yellow-400 text-white' :
                i === 1 ? 'bg-gray-300 text-white' :
                i === 2 ? 'bg-orange-300 text-white' :
                'bg-gray-100 text-muted'
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                <p className="text-[11px] text-muted">{p.party}</p>
              </div>
              <span className={`text-sm font-bold tabular-nums ${getScoreColor(p.score)}`}>
                {formatScore(p.score)}
              </span>
            </Link>
          ))}
        </div>
        <Link to="/politicians" className="block text-center py-2.5 text-xs text-green font-medium hover:bg-gray-50 transition-colors border-t border-border">
          Ver ranking completo →
        </Link>
      </div>

      {/* CTA IA */}
      <div className="bg-white rounded-lg border border-border p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue/10 rounded-lg flex items-center justify-center text-blue text-lg">🤖</div>
          <h3 className="text-sm font-bold text-ink">Diário Oficial + IA</h3>
        </div>
        <p className="text-xs text-muted leading-relaxed mb-3">
          Analise publicações do D.O. com inteligência artificial. Identifique nomeações, licitações e alertas.
        </p>
        <Link to="/diario" className="block text-center bg-blue text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-light transition-colors">
          Analisar agora →
        </Link>
      </div>

      {/* Ad-like info box */}
      <div className="bg-white rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
          <span className="text-[11px] text-muted font-medium">Atualizado em tempo real</span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Dados atualizados automaticamente a cada hora. Scores recalculados com base nos votos e avaliações dos cidadãos.
        </p>
      </div>
    </aside>
  );
}
