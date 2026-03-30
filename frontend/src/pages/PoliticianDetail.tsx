import { useParams, Link } from 'react-router-dom';
import { usePolitician, usePoliticianVotes } from '../hooks/usePoliticians';
import { usePromises } from '../hooks/usePromises';
import PoliticianProfile from '../components/politicians/PoliticianProfile';
import PromiseCard from '../components/promises/PromiseCard';
import PromiseSummary from '../components/promises/PromiseSummary';

export default function PoliticianDetail() {
  const { id } = useParams<{ id: string }>();
  const politicianId = Number(id);
  const { data: politician, isLoading } = usePolitician(politicianId);
  const { data: votes } = usePoliticianVotes(politicianId);
  const { data: promises } = usePromises({ politician_id: String(politicianId) });

  if (isLoading) return <div className="text-center py-16 text-muted text-sm">Carregando...</div>;
  if (!politician) return <div className="text-center py-16"><p className="text-red text-sm">Político não encontrado.</p><Link to="/politicians" className="text-green text-sm mt-2 inline-block hover:underline">← Voltar</Link></div>;

  return (
    <div className="space-y-6">
      <div className="text-[11px] text-muted">
        <Link to="/politicians" className="hover:text-green transition-colors">Políticos</Link>
        <span className="mx-1">/</span>
        <span className="text-ink">{politician.name}</span>
      </div>

      <PoliticianProfile politician={politician} votes={votes} />

      {promises && promises.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-ink mb-4">Promessas de Campanha</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              {promises.map(p => <PromiseCard key={p.id} promise={p} />)}
            </div>
            <PromiseSummary promises={promises} />
          </div>
        </div>
      )}
    </div>
  );
}
