import { getScoreColor } from '../../utils/scoreHelpers';
import { motion } from 'framer-motion';

interface ScoreRingProps {
  score: number;
  size?: number;
}

export default function ScoreRing({ score, size = 48 }: ScoreRingProps) {
  const sw = size > 60 ? 4 : 3;
  const r = (size - sw * 2) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0F0F0" strokeWidth={sw} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
          strokeWidth={sw} strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          strokeLinecap="round"
          className={getScoreColor(score)}
        />
      </svg>
      <span className={`absolute font-bold tabular-nums ${getScoreColor(score)} ${size > 60 ? 'text-base' : 'text-xs'}`}>
        {Number(score).toFixed(0)}
      </span>
    </div>
  );
}
