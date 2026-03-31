import { Link } from 'react-router-dom';
import { Politician, roleLabels } from '../../types/politician';
import { getScoreColor, getScoreLabel } from '../../utils/scoreHelpers';

interface Props {
  politician: Politician;
}

const roleBadge: Record<string, string> = {
  governador: 'bg-green/10 text-green',
  senador: 'bg-blue/10 text-blue',
  dep_federal: 'bg-accent/10 text-accent',
  dep_estadual: 'bg-gold/10 text-gold',
  prefeito: 'bg-green/10 text-green',
  vereador: 'bg-gray-100 text-ink2',
};

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function PoliticianCard({ politician }: Props) {
  const score = Number(politician.score);
  const total = politician.promises_total || 0;
  const done = politician.promises_done || 0;
  const progress = politician.promises_progress || 0;
  const failed = politician.promises_failed || 0;
  const pending = total - done - progress - failed;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Link
      to={`/politicians/${politician.id}`}
      className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-hover transition-all group"
    >
      {/* Header com foto e info */}
      <div className="p-4 flex gap-3">
        {politician.photo_url ? (
          <img
            src={politician.photo_url}
            alt={politician.name}
            className="w-[52px] h-[52px] rounded-full object-cover border-2 border-white shadow-sm shrink-0"
          />
        ) : (
          <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white shadow-sm flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-muted">{getInitials(politician.name)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-bold text-ink leading-tight group-hover:text-green transition-colors truncate">
            {politician.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${roleBadge[politician.role] || roleBadge.vereador}`}>
              {roleLabels[politician.role]}
            </span>
            {politician.party && (
              <span className="text-[10px] text-muted">{politician.party}</span>
            )}
          </div>
        </div>
      </div>

      {/* Score + Promessas */}
      <div className="px-4 pb-4 space-y-3">
        {/* Aprovação */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted font-medium">Aprovação</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-sm font-bold tabular-nums ${getScoreColor(score)}`}>
                {score.toFixed(1)}
              </span>
              <span className={`text-[9px] ${getScoreColor(score)}`}>{getScoreLabel(score)}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                score >= 70 ? 'bg-green' : score >= 40 ? 'bg-gold' : score > 0 ? 'bg-red' : 'bg-gray-200'
              }`}
              style={{ width: `${Math.min(100, score)}%` }}
            />
          </div>
        </div>

        {/* Promessas */}
        {total > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted font-medium">Promessas</span>
              <span className="text-[10px] font-bold text-ink tabular-nums">{done}/{total} cumpridas</span>
            </div>
            {/* Barra segmentada */}
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
              {done > 0 && (
                <div className="h-full bg-green transition-all" style={{ width: `${(done / total) * 100}%` }} />
              )}
              {progress > 0 && (
                <div className="h-full bg-blue transition-all" style={{ width: `${(progress / total) * 100}%` }} />
              )}
              {failed > 0 && (
                <div className="h-full bg-red transition-all" style={{ width: `${(failed / total) * 100}%` }} />
              )}
            </div>
            {/* Legenda mini */}
            <div className="flex items-center gap-3 mt-1.5">
              {done > 0 && (
                <span className="flex items-center gap-1 text-[9px] text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-green" />{done} cumprida{done > 1 ? 's' : ''}
                </span>
              )}
              {progress > 0 && (
                <span className="flex items-center gap-1 text-[9px] text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue" />{progress} em andamento
                </span>
              )}
              {failed > 0 && (
                <span className="flex items-center gap-1 text-[9px] text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-red" />{failed} descumprida{failed > 1 ? 's' : ''}
                </span>
              )}
              {pending > 0 && (
                <span className="flex items-center gap-1 text-[9px] text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />{pending} pendente{pending > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            Nenhuma promessa cadastrada
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <span className="text-[9px] text-muted">{politician.total_votes} votos</span>
          <span className="text-[9px] text-green font-medium group-hover:underline">Ver perfil →</span>
        </div>
      </div>
    </Link>
  );
}
