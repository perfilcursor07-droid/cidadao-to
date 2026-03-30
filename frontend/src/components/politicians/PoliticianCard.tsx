import { Link } from 'react-router-dom';
import { Politician, roleLabels } from '../../types/politician';
import ScoreRing from './ScoreRing';
import { getScoreColor, getScoreLabel } from '../../utils/scoreHelpers';

interface Props {
  politician: Politician;
}

export default function PoliticianCard({ politician }: Props) {
  return (
    <Link
      to={`/politicians/${politician.id}`}
      className="bg-white border border-border rounded-lg p-4 hover:shadow-hover transition-all flex gap-4 group"
    >
      <ScoreRing score={politician.score} size={52} />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-ink group-hover:text-green transition-colors truncate">
          {politician.name}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-green bg-green/8 px-1.5 py-0.5 rounded">
            {roleLabels[politician.role] || politician.role}
          </span>
          {politician.party && <span className="text-[11px] text-muted">{politician.party}</span>}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted">
          <span className={`font-semibold ${getScoreColor(politician.score)}`}>{getScoreLabel(politician.score)}</span>
          <span>•</span>
          <span>{politician.total_votes} votos</span>
          {politician.city && <><span>•</span><span>{politician.city}</span></>}
        </div>
      </div>
    </Link>
  );
}
