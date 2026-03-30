import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminSyncPoliticians } from '../../services/admin';
import api from '../../services/api';

export default function AdminPoliticians() {
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: grouped, isLoading } = useQuery({
    queryKey: ['admin-politicians-grouped'],
    queryFn: () => api.get('/politicians/by-role').then(r => r.data),
  });

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await adminSyncPoliticians();
      setResult(res);
      qc.invalidateQueries({ queryKey: ['admin-politicians-grouped'] });
    } catch (err: any) {
      setResult({ error: err?.response?.data?.error || 'Erro' });
    }
    setSyncing(false);
  };

  const roles = [
    { key: 'governador', label: 'Governador', icon: '🏛️' },
    { key: 'senadores', label: 'Senadores', icon: '🏦' },
    { key: 'deputados_federais', label: 'Dep. Federais', icon: '🏢' },
    { key: 'deputados_estaduais', label: 'Dep. Estaduais', icon: '🏫' },
    { key: 'prefeitos', label: 'Prefeitos', icon: '🏘️' },
    { key: 'vereadores', label: 'Vereadores', icon: '🏠' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Políticos</h1>
          <p className="text-sm text-white/40 mt-0.5">Sincronize dados das APIs oficiais</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-5 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors disabled:opacity-40 flex items-center gap-2"
        >
          {syncing ? (
            <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Sincronizando...</>
          ) : '🔄 Sincronizar APIs'}
        </button>
      </div>

      {result && (
        <div className={`text-sm px-4 py-3 rounded-lg ${result.error ? 'bg-red/10 text-red border border-red/20' : 'bg-green/10 text-green border border-green/20'}`}>
          {result.error || `${result.message} — ${result.created} novos, ${result.updated} atualizados`}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-white/30">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {roles.map(r => {
            const list = grouped?.[r.key] || [];
            return (
              <div key={r.key} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <span>{r.icon}</span>
                  <span className="text-sm font-bold text-white">{r.label}</span>
                  <span className="text-xs text-white/30 ml-auto">{list.length}</span>
                </div>
                {list.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {list.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-xs font-bold">
                            {p.name?.[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/80 font-medium truncate">{p.name}</p>
                          <p className="text-[11px] text-white/30">{p.party} · {p.city}</p>
                        </div>
                        <span className="text-xs text-green font-bold tabular-nums">{Number(p.score).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-xs text-white/20">Nenhum registro</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
