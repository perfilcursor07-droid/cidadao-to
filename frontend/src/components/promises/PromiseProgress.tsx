import { motion } from 'framer-motion';

interface Props {
  progress: number;
  status: string;
}

const colors: Record<string, string> = {
  pending: 'bg-yellow-400',
  progress: 'bg-blue',
  done: 'bg-green',
  failed: 'bg-red',
};

export default function PromiseProgress({ progress, status }: Props) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-[11px] text-muted mb-1">
        <span>Progresso</span>
        <span className="font-bold tabular-nums">{progress}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6 }}
          className={`h-full rounded-full ${colors[status] || 'bg-gray-300'}`}
        />
      </div>
    </div>
  );
}
