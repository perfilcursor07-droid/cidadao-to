import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getAdminUsers } from '../../services/admin';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

const roleBadge: Record<string, string> = {
  admin: 'bg-red/10 text-red',
  editor: 'bg-blue/10 text-blue',
  citizen: 'bg-white/[0.04] text-white/40',
};

export default function AdminUsers() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Usuários</h1>
          <p className="text-sm text-white/40 mt-0.5">{users.length} usuários cadastrados</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/20">
          <span className="bg-red/10 text-red px-2 py-0.5 rounded-full font-bold">{users.filter((u: any) => u.role === 'admin').length} admin</span>
          <span className="bg-white/[0.04] text-white/40 px-2 py-0.5 rounded-full font-bold">{users.filter((u: any) => u.role === 'citizen').length} cidadãos</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden"
      >
        {isLoading ? (
          <p className="px-4 py-6 text-sm text-white/30">Carregando...</p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {users.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white/40 text-sm font-bold shrink-0">
                  {u.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 font-medium truncate">{u.name}</p>
                  <p className="text-[11px] text-white/30">{u.email}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${roleBadge[u.role] || roleBadge.citizen}`}>
                  {u.role}
                </span>
                <span className="text-[11px] text-white/20">{formatDate(u.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
