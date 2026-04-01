import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminSyncPoliticians, adminResetPoliticians, adminFetchPhotos, adminSearchPhoto } from '../../services/admin';
import api from '../../services/api';
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
interface PoliticianEdit { id: number; name: string; party: string | null; city: string | null; bio: string | null; photo_url: string | null; role: string; }
export default function AdminPoliticians() {
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [fetchingPhotos, setFetchingPhotos] = useState(false);
  const [searchingPhoto, setSearchingPhoto] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [editing, setEditing] = useState<PoliticianEdit | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const { data: grouped, isLoading } = useQuery({ queryKey: ['admin-politicians-grouped'], queryFn: () => api.get('/politicians/by-role').then(r => r.data) });
  const busy = syncing || resetting || fetchingPhotos;
  const handleSync = async () => { setSyncing(true); setResult(null); try { const r = await adminSyncPoliticians(); setResult(r); qc.invalidateQueries({ queryKey: ['admin-politicians-grouped'] }); } catch (e: any) { setResult({ error: e?.response?.data?.error || 'Erro' }); } setSyncing(false); };
  const handleFetchPhotos = async () => { setFetchingPhotos(true); setResult({ message: 'Buscando fotos...' }); try { const r = await adminFetchPhotos(); setResult({ message: r.found + ' fotos encontradas de ' + r.total + ' sem foto.' }); qc.invalidateQueries({ queryKey: ['admin-politicians-grouped'] }); } catch (e: any) { setResult({ error: e?.response?.data?.error || 'Erro' }); } setFetchingPhotos(false); };
  const handleSearchPhoto = async () => { if (!editing) return; setSearchingPhoto(true); try { const r = await adminSearchPhoto(editing.name, editing.role); if (r.found && r.photo_url) { setEditing({ ...editing, photo_url: r.photo_url }); } else { alert('Nenhuma foto encontrada.'); } } catch (e: any) { alert('Erro: ' + (e?.response?.data?.error || e.message)); } setSearchingPhoto(false); };
  const handleReset = async () => { if (!confirm('APAGAR todos?')) return; setResetting(true); setResult(null); try { const r = await adminResetPoliticians(); setResult(r); qc.invalidateQueries({ queryKey: ['admin-politicians-grouped'] }); } catch (e: any) { setResult({ error: e?.response?.data?.error || 'Erro' }); } setResetting(false); };
  const handleSave = async () => { if (!editing) return; setSaving(true); try { await api.put('/admin/politicians/' + editing.id, editing); qc.invalidateQueries({ queryKey: ['admin-politicians-grouped'] }); setEditing(null); } catch (e: any) { alert(e?.response?.data?.error || 'Erro'); } setSaving(false); };
  const roles = [ { key: 'governador', label: 'Governador', icon: 'Gov' }, { key: 'senadores', label: 'Senadores', icon: 'Sen' }, { key: 'deputados_federais', label: 'Dep. Federais', icon: 'DF' }, { key: 'deputados_estaduais', label: 'Dep. Estaduais', icon: 'DE' }, { key: 'prefeitos', label: 'Prefeitos', icon: 'Pref' }, { key: 'vereadores', label: 'Vereadores', icon: 'Ver' } ];
  const filterList = (list: any[]) => { if (!search.trim()) return list; const q = search.toLowerCase(); return list.filter((p: any) => p.name?.toLowerCase().includes(q) || p.party?.toLowerCase().includes(q)); };
  const totalPol = roles.reduce((s, r) => s + (grouped?.[r.key]?.length || 0), 0);
  const noPhotoCount = roles.reduce((s, r) => s + (grouped?.[r.key]?.filter((p: any) => !p.photo_url)?.length || 0), 0);
  return (<div className="space-y-5">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div><h1 className="text-xl font-bold text-white">Politicos</h1><p className="text-sm text-white/40 mt-0.5">{totalPol} cadastrados - {noPhotoCount} sem foto</p></div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleSync} disabled={busy} className="px-4 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors disabled:opacity-40">{syncing ? 'Sincronizando...' : 'Sincronizar'}</button>
        <button onClick={handleFetchPhotos} disabled={busy} className="px-4 py-2 bg-blue text-white rounded-lg text-sm font-medium hover:bg-blue-light transition-colors disabled:opacity-40">{fetchingPhotos ? 'Buscando...' : 'Buscar Fotos'}</button>
        <button onClick={handleReset} disabled={busy} className="px-4 py-2 bg-white/[0.04] text-red/70 border border-red/10 rounded-lg text-sm font-medium hover:bg-red/10 transition-colors disabled:opacity-40">{resetting ? 'Resetando...' : 'Resetar'}</button>
      </div>
    </div>
    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou partido..." className="w-full bg-white/[0.03] border border-white/[0.06] text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-green/30 placeholder:text-white/20" />
    {result && (<motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={'text-sm px-4 py-3 rounded-lg ' + (result.error ? 'bg-red/10 text-red border border-red/20' : 'bg-green/10 text-green border border-green/20')}>{result.error || result.message}</motion.div>)}
    <AnimatePresence>{editing && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#1a1d2e] border border-white/[0.08] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
          <h2 className="text-sm font-bold text-white">Editar Politico</h2>
          <div className="flex items-center gap-4">
            {editing.photo_url ? <img src={editing.photo_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white/10" /> : <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-lg font-bold">{editing.name?.split(' ').slice(0, 2).map(w => w[0]).join('')}</div>}
            <div className="flex-1"><p className="text-sm text-white font-medium">{editing.name}</p><p className="text-[11px] text-white/30">{editing.role} - {editing.party}</p></div>
          </div>
          <div>
            <label className="block text-[11px] text-white/40 mb-1">URL da foto</label>
            <div className="flex gap-2">
              <input value={editing.photo_url || ''} onChange={e => setEditing({ ...editing, photo_url: e.target.value || null })} className="flex-1 bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green/40" placeholder="https://..." />
              <button onClick={handleSearchPhoto} disabled={searchingPhoto} className="px-3 py-2 bg-blue text-white rounded-lg text-xs font-medium hover:bg-blue-light transition-colors disabled:opacity-40 shrink-0">{searchingPhoto ? 'Buscando...' : 'Buscar foto'}</button>
            </div>
            {editing.photo_url && <div className="mt-2 flex items-center gap-2"><img src={editing.photo_url} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-white/10" /><span className="text-[10px] text-white/30 truncate flex-1">{editing.photo_url}</span></div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[11px] text-white/40 mb-1">Nome</label><input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2" /></div>
            <div><label className="block text-[11px] text-white/40 mb-1">Partido</label><input value={editing.party || ''} onChange={e => setEditing({ ...editing, party: e.target.value || null })} className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2" /></div>
          </div>
          <div><label className="block text-[11px] text-white/40 mb-1">Bio</label><textarea value={editing.bio || ''} onChange={e => setEditing({ ...editing, bio: e.target.value || null })} rows={2} className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 resize-none" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-white/40 hover:text-white/70">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark disabled:opacity-40">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </motion.div>
      </motion.div>
    )}</AnimatePresence>
    {isLoading ? <div className="flex items-center gap-2 text-sm text-white/30 py-6"><span className="w-2 h-2 rounded-full bg-green animate-pulse" /> Carregando...</div> : (
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
        {roles.map(r => { const list = filterList(grouped?.[r.key] || []); if (search.trim() && list.length === 0) return null; const np = list.filter((p: any) => !p.photo_url).length; return (
          <motion.div key={r.key} variants={fadeUp} className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.04] flex items-center gap-2">
              <span className="text-sm font-bold text-white/80">{r.icon} {r.label}</span>
              {np > 0 && <span className="text-[9px] text-red/60 bg-red/10 px-1.5 py-0.5 rounded">{np} sem foto</span>}
              <span className="text-[10px] text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded ml-auto tabular-nums">{list.length}</span>
            </div>
            {list.length > 0 ? <div className="divide-y divide-white/[0.03]">{list.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors group">
                {p.photo_url ? <img src={p.photo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/[0.08] shrink-0" /> : <div className="w-8 h-8 rounded-full bg-red/10 border border-red/20 flex items-center justify-center text-red/40 text-[10px] font-bold shrink-0">{p.name?.split(' ').slice(0, 2).map((w: string) => w[0]).join('')}</div>}
                <div className="flex-1 min-w-0"><p className="text-sm text-white/75 font-medium truncate">{p.name}</p><p className="text-[10px] text-white/25">{p.party || '-'} - {p.city || '-'}</p></div>
                <span className={'text-xs font-bold tabular-nums ' + (Number(p.score) >= 70 ? 'text-green' : Number(p.score) >= 40 ? 'text-yellow-400' : Number(p.score) > 0 ? 'text-red-400' : 'text-white/20')}>{Number(p.score).toFixed(1)}</span>
                <button onClick={() => setEditing({ id: p.id, name: p.name, party: p.party, city: p.city, bio: p.bio, photo_url: p.photo_url, role: p.role })} className="text-[11px] text-white/15 hover:text-white/50 transition-colors opacity-0 group-hover:opacity-100">Edit</button>
              </div>
            ))}</div> : <p className="px-4 py-3 text-xs text-white/15">Nenhum registro</p>}
          </motion.div>
        ); })}
      </motion.div>
    )}
  </div>);
}
