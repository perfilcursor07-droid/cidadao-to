import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePolitician, usePoliticianVotes } from '../hooks/usePoliticians';
import { usePromises } from '../hooks/usePromises';
import PoliticianProfile from '../components/politicians/PoliticianProfile';
import PromiseCard from '../components/promises/PromiseCard';
import PromiseSummary from '../components/promises/PromiseSummary';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [.22,1,.36,1] } },
};

export default function PoliticianDetail() {
  const { id } = useParams<{ id: string }>();
  const politicianId = Number(id);
  const { data: politician, isLoading } = usePolitician(politicianId);
  const { data: votes } = usePoliticianVotes(politicianId);
  const { data: promises } = usePromises({ politician_id: String(politicianId) });

  if (isLoading) return <div className="text-center py-16 text-muted text-sm">Carregando...</div>;
  if (!politician) return <div className="text-center py-16"><p className="text-red text-sm">Político não encontrado.</p><Link to="/politicians" className="text-green text-sm mt-2 inline-block hover:underline">← Voltar</Link></div>;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-muted">
        <Link to="/politicians" className="hover:text-green transition-colors">Políticos</Link>
        <span className="mx-1">/</span>
        <span className="text-ink">{politician.name}</span>
      </motion.div>

      <PoliticianProfile politician={politician} votes={votes} />

      {promises && promises.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-base font-bold text-ink mb-3">Promessas de Campanha</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="lg:col-span-2 space-y-3"
            >
              {promises.map(p => (
                <motion.div key={p.id} variants={fadeUp}>
                  <PromiseCard promise={p} />
                </motion.div>
              ))}
            </motion.div>
            <PromiseSummary promises={promises} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
