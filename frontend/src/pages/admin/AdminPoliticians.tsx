import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminSyncPoliticians, adminResetPoliticians } from '../../services/admin';
import api from '../../services/api';

interface PoliticianEdit {
  id: number;
  name: string;
  party: string | null;
  city: string | null;
  bio: string | null;
  photo_url: string | null;
  role: string;
}

export default function AdminPoliticians() {
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [editing, setEditing] = useState<PoliticianEdit | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: grouped, isLoading } = useQuery({
    queryKey: ['admin-politicians-grouped'],
    queryFn: () => api.get('/politicians/by-role').then(r => r.data),
  });

  const handleSync = async () => {
    setSyncing(true); setResult(null);
    try { const res = await adminSyncPoliticians(); setResult(res); qc.invalidateQueries({ queryKey: ['admin-politicians-grouped'] }); }
    catch (err: any) { setResult({ error: err?.response?.data?.error || 'Erro' }); }
    setSyncing(false);
  };

  const handleReset = async () => {
    if (!confirm('Isso vai APAGAR todos os políticos e recriar do zero. Continuar?')) return;
    setResetting(true); setResult(null);
    try { const res = await adminResetPoliticians(); setResult(res); qc.invalidateQueries({ queryKey: ['admin-politicians-grouped'] }); }
    catch (err: any) { setResult({ error: err?.response?.data?.error || 'Erro' }); }
    setResetting(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/admin/politicians/${editing.id}`, editing);
      qc.invalidateQueries({ queryKey: ['admin-politicians-grouped'] });
      setEditing(null);
    } catch (err: any) { alert(err?.response?.data?.error || 'Erro'); }
    setSaving(false);
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Políticos</h1>
          <p className="text-sm text-white/40 mt-0.5">Gerencie dados, fotos e sincronize APIs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSync} disabled={syncing || resetting}
            className="px-4 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors disabled:opacity-40 flex items-center gap-2">
            {syncing ? <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Sincronizando...</> : '🔄 Sincronizar'}
          </button>
          <button onClick={handleReset} disabled={syncing || resetting}
            className="px-4 py-2 bg-red/80 text-white rounded-lg text-sm font-medium hover:bg-red transition-colors disabled:opacity-40">
            {resetting ? 'Resetando...' : '🗑️ Resetar'}
          </button>
        </div>
      </div>

      {result && (
        <div className={`text-sm px-4 py-3 rounded-lg ${result.error ? 'bg-red/10 text-red border border-red/20' : 'bg-green/10 text-green border border-green/20'}`}>
          {result.error || result.message}
        </div>
      )}

      {/* Modal de edição */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-[#1a1d27] border border-white/10 rounded-xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-sm font-bold text-white">Editar Político</h2>

            {/* Preview da foto */}
            <div className="flex items-center gap-4">
              {editing.photo_url ? (
                <img src={editing.photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/10" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-lg font-bold">
                  {editing.name?.split(' ').slice(0, 2).map(w => w[0]).join('')}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-white font-medium">{editing.name}</p>
                <p className="text-[11px] text-white/30">{editing.role} · {editing.party}</p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-white/40 mb-1">URL da foto</label>
              <input
                value={editing.photo_url || ''}
                onChange={e => setEditing({ ...editing, photo_url: e.target.value || null })}
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green/50"
                placeholder="https://exemplo.com/foto.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Nome</label>
                <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Partido</label>
                <input value={editing.party || ''} onChange={e => setEditing({ ...editing, party: e.target.value || null })}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-white/40 mb-1">Bio</label>
              <textarea value={editing.bio || ''} onChange={e => setEditing({ ...editing, bio: e.target.value || null })}
                rows={2} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 resize-none" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-white/40 hover:text-white/70">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark disabled:opacity-40">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
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
                      <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 group">
                        {/* Foto */}
                        {p.photo_url ? (
                          <img src={p.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-[10px] font-bold shrink-0">
                            {p.name?.split(' ').slice(0, 2).map((w: string) => w[0]).join('')}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/80 font-medium truncate">{p.name}</p>
                          <p className="text-[11px] text-white/30">{p.party || '—'} · {p.city}</p>
                        </div>
                        <span className="text-xs text-green font-bold tabular-nums">{Number(p.score).toFixed(1)}</span>
                        <button
                          onClick={() => setEditing({ id: p.id, name: p.name, party: p.party, city: p.city, bio: p.bio, photo_url: p.photo_url, role: p.role })}
                          className="text-[11px] text-white/20 hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100"
                        >✏️</button>
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
