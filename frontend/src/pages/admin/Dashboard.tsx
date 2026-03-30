import { useQuery } from '@tanstack/react-query';
import { getAdminStats } from '../../services/admin';

const statCards = [
  { key: 'users', label: 'Usuários', icon: '👥', color: 'from-blue/20 to-blue/5 border-blue/20 text-blue' },
  { key: 'politicians', label: 'Políticos', icon: '🏛️', color: 'from-green/20 to-green/5 border-green/20 text-green' },
  { key: 'promises', label: 'Promessas', icon: '📋', color: 'from-gold/20 to-gold/5 border-gold/20 text-gold' },
  { key: 'news', label: 'Notícias', icon: '📰', color: 'from-accent/20 to-accent/5 border-accent/20 text-accent' },
  { key: 'diarios', label: 'Diários', icon: '📄', color: 'from-green/20 to-green/5 border-green/20 text-green' },
  { key: 'votes', label: 'Votos', icon: '🗳️', color: 'from-blue/20 to-blue/5 border-blue/20 text-blue' },
  { key: 'ratings', label: 'Avaliações', icon: '⭐', color: 'from-gold/20 to-gold/5 border-gold/20 text-gold' },
] as const;

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/40 mt-0.5">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(card => (
          <div
            key={card.key}
            className={`bg-gradient-to-br ${card.color} border rounded-xl p-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{card.icon}</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {isLoading ? '—' : stats?.[card.key] ?? 0}
            </div>
            <div className="text-[11px] opacity-60 font-medium mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
