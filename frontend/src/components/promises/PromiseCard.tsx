import { PromiseItem, statusLabels } from '../../types/promise';
import PromiseProgress from './PromiseProgress';
import { formatDate } from '../../utils/formatters';

interface Props {
  promise: PromiseItem;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  progress: 'bg-blue-50 text-blue-700 border-blue-200',
  done: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

export default function PromiseCard({ promise }: Props) {
  return (
    <div className="bg-white border border-border rounded-lg p-4 hover:shadow-card transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-ink leading-snug">{promise.title}</h3>
          {promise.description && (
            <p className="text-xs text-muted mt-1 line-clamp-2">{promise.description}</p>
          )}
        </div>
        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusStyles[promise.status]}`}>
          {statusLabels[promise.status]}
        </span>
      </div>
      <div className="mt-3">
        <PromiseProgress progress={promise.progress_pct} status={promise.status} />
      </div>
      <div className="flex items-center flex-wrap gap-2 mt-2 text-[11px] text-muted">
        {promise.area && <span className="bg-surface px-1.5 py-0.5 rounded">{promise.area}</span>}
        {promise.deadline && <span>{formatDate(promise.deadline)}</span>}
        {promise.politician && <span className="font-medium text-ink2">{promise.politician.name}</span>}
      </div>
    </div>
  );
}
