import { getScoreBg } from '../../utils/scoreHelpers';

interface ScoreBarProps {
  value: number;
  max?: number;
  label?: string;
}

export default function ScoreBar({ value, max = 100, label }: ScoreBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-xs text-muted mb-1"><span>{label}</span><span>{value.toFixed(1)}</span></div>}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${getScoreBg(value)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
