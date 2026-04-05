import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { getPromises, createPromise, updatePromise, deletePromise } from '../../services/promises';
import { adminResearchAllPromises, adminResearchPromises, adminUpdatePromisesStatus, adminResetPromises } from '../../services/admin';
import api from '../../services/api';
import { PromiseItem, statusLabels, statusColors } from '../../types/promise';

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const areas = ['Saúde', 'Educação', 'Segurança', 'Infraestrutura', 'Economia', 'Meio Ambiente', 'Social', 'Transporte', 'Cultura', 'Outro'];

export default function AdminPromises() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<PromiseItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [researching, setResearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [search, setSearch] = useState('');
  const [pdfModal, setPdfModal] = useState<{ politicianId: number; name: string } | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: promises = [], isLoading } = useQuery({ queryKey: ['admin-promises'], queryFn: () => getPromises() });
  const { data: politicians = [] } = useQuery({ queryKey: ['admin-politicians-list'], queryFn: () => api.get('/politicians?active=true').then(r => r.data) });

  const handleSave = async () => {
    if (!editing?.title || !editing?.politician_id) return;
    setSaving(true);
    try {
      if (editing.id) await updatePromise(editing.id, editing);
      else await createPromise(editing);
      qc.invalidateQueries({ queryKey: ['admin-promises'] });
      setEditing(null);
    } catch (err: any) { alert(err?.response?.data?.error || 'Erro ao salvar'); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover esta promessa?')) return;
    await deletePromise(id);
    qc.invalidateQueries({ queryKey: ['admin-promises'] });
  };

  const handleResearchAll = async () => {
    setResearching(true);
    setAiStatus('🔍 Buscando planos de governo e extraindo promessas de todos os políticos...');
    try {
      const res = await adminResearchAllPromises();
      setAiStatus(`✅ ${res.message}`);
      setTimeout(() => qc.invalidateQueries({ queryKey: ['admin-promises'] }), 3000);
    } catch (err: any) { setAiStatus(`❌ ${err?.response?.data?.error || 'Erro'}`); }
    setResearching(false);
  };

  const handleExtractFromPdf = async () => {
    if (!pdfModal) return;
    setPdfLoading(true);
    setAiStatus(`📄 Extraindo promessas do plano de governo de ${pdfModal.name}...`);
    try {
      const res = await adminResearchPromises(pdfModal.politicianId, pdfUrl || undefined);
      const msg = res.pdf_url
        ? `✅ ${res.found} promessas extraídas do plano de ${res.politician} (${res.created} novas)`
        : `✅ ${res.found} promessas encontradas via notícias para ${res.politician} (${res.created} novas)`;
      setAiStatus(msg);
      qc.invalidateQueries({ queryKey: ['admin-promises'] });
      setPdfModal(null);
      setPdfUrl('');
    } catch (err: any) { setAiStatus(`❌ ${err?.response?.data?.error || 'Erro'}`); }
    setPdfLoading(false);
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    setAiStatus('🔄 Atualizando status com IA...');
    try {
      const res = await adminUpdatePromisesStatus();
      setAiStatus(`✅ ${res.updated} promessas atualizadas`);
      qc.invalidateQueries({ queryKey: ['admin-promises'] });
    } catch (err: any) { setAiStatus(`❌ ${err?.response?.data?.error || 'Erro'}`); }
    setUpdating(false);
  };

  const grouped = promises.reduce((acc: Record<string, PromiseItem[]>, p) => {
    const name = (p as any).politician?.name || `Político #${p.politician_id}`;
    (acc[name] ||= []).push(p);
    return acc;
  }, {});

  const filteredGrouped = Object.entries(grouped).filter(([name, items]) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || items.some(p => p.title.toLowerCase().includes(q));
  });

  const done = promises.filter(p => p.status === 'done').length;
  const progress = promises.filter(p => p.status === 'progress').length;
  const pending = promises.filter(p => p.status === 'pending').length;
  const failed = promises.filter(p => p.status === 'failed').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Promessas de Campanha</h1>
          <p className="text-sm text-white/40 mt-0.5">{promises.length} cadastradas</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleResearchAll} disabled={researching || updating}
            className="px-3.5 py-2 bg-blue text-white rounded-lg text-xs font-medium hover:bg-blue-light transition-colors disabled:opacity-40 flex items-center gap-1.5">
            {researching ? <><span className="w-2.5 h-2.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Pesquisando...</> : '📄 Extrair planos de governo'}
          </button>
          <button onClick={handleUpdateStatus} disabled={researching || updating}
            className="px-3.5 py-2 bg-white/[0.04] text-white/60 border border-white/[0.06] rounded-lg text-xs font-medium hover:bg-white/[0.06] transition-colors disabled:opacity-40">
            {updating ? 'Verificando...' : '🔍 Verificar cumprimento'}
          </button>
          <button onClick={async () => {
            if (!confirm('Apagar TODAS as promessas?')) return;
            try { const res = await adminResetPromises(); setAiStatus(`✅ ${res.message}`); qc.invalidateQueries({ queryKey: ['admin-promises'] }); }
            catch (err: any) { setAiStatus(`❌ ${err?.response?.data?.error || 'Erro'}`); }
          }} disabled={researching || updating}
            className="px-3.5 py-2 bg-white/[0.04] text-red/60 border border-red/10 rounded-lg text-xs font-medium hover:bg-red/10 transition-colors disabled:opacity-40">
            🗑️ Resetar
          </button>
          <button onClick={() => setEditing({ status: 'pending', progress_pct: 0 })}
            className="px-3.5 py-2 bg-green text-white rounded-lg text-xs font-medium hover:bg-green-dark transition-colors">
            + Manual
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Cumpridas', value: done, color: 'text-green', bg: 'border-green/10' },
          { label: 'Andamento', value: progress, color: 'text-blue', bg: 'border-blue/10' },
          { label: 'Pendentes', value: pending, color: 'text-yellow-400', bg: 'border-yellow-400/10' },
          { label: 'Descumpridas', value: failed, color: 'text-red-400', bg: 'border-red-400/10' },
        ].map(s => (
          <div key={s.label} className={`bg-white/[0.02] border ${s.bg} rounded-lg px-3 py-2 text-center`}>
            <div className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-[9px] text-white/25 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar promessa ou político..."
        className="w-full bg-white/[0.03] border border-white/[0.06] text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-green/30 placeholder:text-white/20" />

      {aiStatus && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="text-sm px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/60">
          {aiStatus}
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1a1d2e] border border-white/[0.08] rounded-xl w-full max-w-lg p-5 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-sm font-bold text-white">{editing.id ? 'Editar' : 'Nova'} Promessa</h2>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Político</label>
                <select value={editing.politician_id || ''} onChange={e => setEditing({ ...editing, politician_id: Number(e.target.value) })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2">
                  <option value="">Selecione...</option>
                  {politicians.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Título</label>
                <input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2" placeholder="Ex: Construir 10 creches" />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Descrição</label>
                <textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })}
                  rows={2} className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Área</label>
                  <select value={editing.area || ''} onChange={e => setEditing({ ...editing, area: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2">
                    <option value="">Selecione...</option>
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Status</label>
                  <select value={editing.status || 'pending'} onChange={e => setEditing({ ...editing, status: e.target.value as any })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2">
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Progresso ({editing.progress_pct || 0}%)</label>
                  <input type="range" min="0" max="100" value={editing.progress_pct || 0}
                    onChange={e => setEditing({ ...editing, progress_pct: Number(e.target.value) })} className="w-full accent-green" />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Prazo</label>
                  <input type="date" value={editing.deadline?.split('T')[0] || ''}
                    onChange={e => setEditing({ ...editing, deadline: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors">Cancelar</button>
                <button onClick={handleSave} disabled={saving || !editing.title || !editing.politician_id}
                  className="px-5 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark disabled:opacity-40 transition-colors">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Modal */}
      <AnimatePresence>
        {pdfModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setPdfModal(null); setPdfUrl(''); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1a1d2e] border border-white/[0.08] rounded-xl w-full max-w-lg p-5 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-sm font-bold text-white">📄 Extrair promessas — {pdfModal.name}</h2>
              <p className="text-xs text-white/40">Cole a URL do PDF do plano de governo. Se deixar vazio, o sistema vai buscar automaticamente na internet.</p>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">URL do PDF (opcional)</label>
                <input
                  value={pdfUrl}
                  onChange={e => setPdfUrl(e.target.value)}
                  placeholder="https://exemplo.com/plano-de-governo.pdf"
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-2 placeholder:text-white/15"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setPdfModal(null); setPdfUrl(''); }} className="px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors">Cancelar</button>
                <button onClick={handleExtractFromPdf} disabled={pdfLoading}
                  className="px-5 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark disabled:opacity-40 transition-colors flex items-center gap-2">
                  {pdfLoading ? (
                    <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Extraindo...</>
                  ) : '📄 Extrair promessas'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-white/30 py-6">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" /> Carregando...
        </div>
      ) : promises.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-sm text-white/40">Nenhuma promessa cadastrada</p>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
          {filteredGrouped.map(([name, items]) => (
            <motion.div key={name} variants={fadeUp} className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/[0.04] flex items-center gap-2">
                <span className="text-sm font-bold text-white/80">{name}</span>
                <button
                  onClick={() => {
                    const pol = politicians.find((p: any) => p.name === name);
                    if (pol) setPdfModal({ politicianId: pol.id, name: pol.name });
                  }}
                  className="text-[10px] text-blue/60 hover:text-blue transition-colors"
                  title="Extrair promessas do plano de governo"
                >📄 Plano</button>
                <span className="text-[10px] text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded ml-auto tabular-nums">{items.length}</span>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {items.map(p => (
                  <div key={p.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${statusColors[p.status]}`}>
                          {statusLabels[p.status]}
                        </span>
                        {p.area && <span className="text-[10px] text-white/25">{p.area}</span>}
                      </div>
                      <p className="text-sm text-white/75 font-medium">{p.title}</p>
                      {p.description && <p className="text-xs text-white/25 mt-0.5 line-clamp-1">{p.description}</p>}
                      <div className="w-full h-1 bg-white/[0.04] rounded-full mt-2 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${p.status === 'done' ? 'bg-green' : p.status === 'failed' ? 'bg-red' : 'bg-blue'}`}
                          style={{ width: `${p.progress_pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-white/20 tabular-nums shrink-0">{p.progress_pct}%</span>
                    <button onClick={() => setEditing(p)} className="text-[11px] text-white/15 hover:text-white/50 transition-colors opacity-0 group-hover:opacity-100">✏️</button>
                    <button onClick={() => handleDelete(p.id)} className="text-[11px] text-red/30 hover:text-red transition-colors opacity-0 group-hover:opacity-100">🗑️</button>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
