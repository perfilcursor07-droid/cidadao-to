import { PromiseItem } from '../../types/promise';

interface Props {
  promises: PromiseItem[];
}

export default function PromiseSummary({ promises }: Props) {
  const total = promises.length;
  const done = promises.filter(p => p.status === 'done').length;
  const progress = promises.filter(p => p.status === 'progress').length;
  const pending = promises.filter(p => p.status === 'pending').length;
  const failed = promises.filter(p => p.status === 'failed').length;
  const rate = total > 0 ? ((done / total) * 100).toFixed(0) : '0';

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden sticky top-20">
      <div className="bg-green px-4 py-2.5">
        <h3 className="text-sm font-bold text-white">Resumo</h3>
      </div>
      <div className="p-4">
        <div className="text-center mb-4 pb-4 border-b border-border">
          <div className="text-3xl font-bold text-green tabular-nums">{rate}%</div>
          <div className="text-[11px] text-muted">Taxa de cumprimento</div>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Total', value: total, color: 'text-ink' },
            { label: 'Cumpridas', value: done, color: 'text-green' },
            { label: 'Em andamento', value: progress, color: 'text-blue' },
            { label: 'Pendentes', value: pending, color: 'text-yellow-600' },
            { label: 'Descumpridas', value: failed, color: 'text-red' },
          ].map(s => (
            <div key={s.label} className="flex justify-between items-center text-sm">
              <span className="text-muted text-xs">{s.label}</span>
              <span className={`font-bold tabular-nums ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
