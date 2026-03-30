import { useState } from 'react';
import { usePromises } from '../hooks/usePromises';
import PromiseCard from '../components/promises/PromiseCard';
import PromiseSummary from '../components/promises/PromiseSummary';
import PageTitle from '../components/shared/PageTitle';

const statuses = ['', 'pending', 'progress', 'done', 'failed'];
const labels: Record<string, string> = { '': 'Todas', pending: 'Pendentes', progress: 'Em andamento', done: 'Cumpridas', failed: 'Descumpridas' };

export default function Promises() {
  const [status, setStatus] = useState('');
  const filters: Record<string, string> = {};
  if (status) filters.status = status;
  const { data: promises, isLoading } = usePromises(filters);

  return (
    <div>
      <PageTitle title="Promessas de Campanha" subtitle="Monitore o cumprimento das promessas dos políticos tocantinenses" />
      <div className="flex flex-wrap gap-1.5 mb-6">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              status === s ? 'bg-green text-white' : 'bg-white border border-border text-muted hover:text-ink'
            }`}>
            {labels[s]}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="text-center py-16 text-muted text-sm">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {promises?.map(p => <PromiseCard key={p.id} promise={p} />)}
            {promises?.length === 0 && <p className="text-muted text-sm text-center py-16">Nenhuma promessa encontrada.</p>}
          </div>
          {promises && promises.length > 0 && <PromiseSummary promises={promises} />}
        </div>
      )}
    </div>
  );
}
