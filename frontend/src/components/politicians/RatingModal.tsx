import { useState } from 'react';
import { useCreateRating } from '../../hooks/useRating';
import { motion } from 'framer-motion';

interface Props {
  politicianId: number;
  onClose: () => void;
}

const criteria = [
  { key: 'attendance', label: 'Presença' },
  { key: 'project_quality', label: 'Qualidade dos Projetos' },
  { key: 'transparency', label: 'Transparência' },
  { key: 'communication', label: 'Comunicação' },
] as const;

export default function RatingModal({ politicianId, onClose }: Props) {
  const [values, setValues] = useState({ attendance: 3, project_quality: 3, transparency: 3, communication: 3 });
  const { mutate, isPending } = useCreateRating();
  const avg = (values.attendance + values.project_quality + values.transparency + values.communication) / 4;

  const handleSubmit = () => {
    mutate({ politician_id: politicianId, ...values }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-modal"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-ink mb-1">Avaliar Político</h3>
        <p className="text-xs text-muted mb-5">Avalie de 1 a 5 em cada critério</p>

        <div className="space-y-4">
          {criteria.map(c => (
            <div key={c.key}>
              <label className="text-sm text-ink2 font-medium mb-1.5 block">{c.label}</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setValues(v => ({ ...v, [c.key]: n }))}
                    className={`flex-1 h-9 rounded-lg text-sm font-bold transition-all ${
                      values[c.key] >= n ? 'bg-gold text-white' : 'bg-gray-100 text-muted hover:bg-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 bg-surface rounded-lg p-3 text-center">
          <span className="text-xs text-muted">Média</span>
          <div className="text-xl font-bold text-gold">{avg.toFixed(1)}</div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-lg text-sm text-muted hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={isPending}
            className="flex-1 py-2.5 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors disabled:opacity-50">
            {isPending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
