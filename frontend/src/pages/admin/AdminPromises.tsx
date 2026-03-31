import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPromises, createPromise, updatePromise, deletePromise } from '../../services/promises';
import { adminResearchAllPromises, adminResearchPromises, adminUpdatePromisesStatus, adminResetPromises } from '../../services/admin';
import api from '../../services/api';
import { PromiseItem, statusLabels, statusColors } from '../../types/promise';

const areas = ['Saúde', 'Educação', 'Segurança', 'Infraestrutura', 'Economia', 'Meio Ambiente', 'Social', 'Transporte', 'Cultura', 'Outro'];

export default function AdminPromises() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<PromiseItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [researching, setResearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [aiStatus, setAiStatus] = useState('');

  const { data: promises = [], isLoading } = useQuery({
    queryKey: ['admin-promises'],
    queryFn: () => getPromises(),
  });

  const { data: politicians = [] } = useQuery({
    queryKey: ['admin-politicians-list'],
    queryFn: () => api.get('/politicians?active=true').then(r => r.data),
  });

  const handleSave = async () => {
    if (!editing?.title || !editing?.politician_id) return;
    setSaving(true);
    try {
      if (editing.id) {
        await updatePromise(editing.id, editing);
      } else {
        await createPromise(editing);
      }
      qc.invalidateQueries({ queryKey: ['admin-promises'] });
      setEditing(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar');
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover esta promessa?')) return;
    await deletePromise(id);
    qc.invalidateQueries({ queryKey: ['admin-promises'] });
  };

  const handleResearchAll = async () => {
    setResearching(true);
    setAiStatus('🔍 Pesquisando promessas de todos os políticos... Pode demorar alguns minutos.');
    try {
      const res = await adminResearchAllPromises();
      setAiStatus(`✅ ${res.message}`);
      setTimeout(() => qc.invalidateQueries({ queryKey: ['admin-promises'] }), 3000);
    } catch (err: any) {
      setAiStatus(`❌ ${err?.response?.data?.error || 'Erro'}`);
    }
    setResearching(false);
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    setAiStatus('🔄 Atualizando status das promessas com IA...');
    try {
      const res = await adminUpdatePromisesStatus();
      setAiStatus(`✅ ${res.updated} promessas atualizadas`);
      qc.invalidateQueries({ queryKey: ['admin-promises'] });
    } catch (err: any) {
      setAiStatus(`❌ ${err?.response?.data?.error || 'Erro'}`);
    }
    setUpdating(false);
  };

  const handleResearchOne = async (politicianId: number) => {
    setAiStatus(`🔍 Pesquisando promessas...`);
    try {
      const res = await adminResearchPromises(politicianId);
      setAiStatus(`✅ ${res.politician}: ${res.found} encontradas, ${res.created} novas`);
      qc.invalidateQueries({ queryKey: ['admin-promises'] });
    } catch (err: any) {
      setAiStatus(`❌ ${err?.response?.data?.error || 'Erro'}`);
    }
  };

  const grouped = promises.reduce((acc: Record<string, PromiseItem[]>, p) => {
    const name = (p as any).politician?.name || `Político #${p.politician_id}`;
    (acc[name] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Promessas de Campanha</h1>
          <p className="text-sm text-white/40 mt-0.5">{promises.length} promessas cadastradas</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleResearchAll}
            disabled={researching || updating}
            className="px-4 py-2 bg-blue text-white rounded-lg text-sm font-medium hover:bg-blue-light transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {researching ? <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Pesquisando...</> : '🤖 Pesquisar com IA'}
          </button>
          <button
            onClick={handleUpdateStatus}
            disabled={researching || updating}
            className="px-4 py-2 border border-white/10 text-white/70 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            {updating ? 'Atualizando...' : '🔄 Atualizar status'}
          </button>
          <button
            onClick={async () => {
              if (!confirm('Apagar TODAS as promessas? Depois use "Pesquisar com IA" pra recriar com fontes.')) return;
              setAiStatus('🗑️ Removendo promessas...');
              try {
                const res = await adminResetPromises();
                setAiStatus(`✅ ${res.message}`);
                qc.invalidateQueries({ queryKey: ['admin-promises'] });
              } catch (err: any) { setAiStatus(`❌ ${err?.response?.data?.error || 'Erro'}`); }
            }}
            disabled={researching || updating}
            className="px-4 py-2 bg-red/80 text-white rounded-lg text-sm font-medium hover:bg-red transition-colors disabled:opacity-40"
          >
            🗑️ Resetar
          </button>
          <button
            onClick={() => setEditing({ status: 'pending', progress_pct: 0 })}
            className="px-4 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors"
          >
            + Manual
          </button>
        </div>
      </div>

      {/* Status IA */}
      {aiStatus && (
        <div className="text-sm px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white/70">
          {aiStatus}
        </div>
      )}

      {/* Modal de edição */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-[#1a1d27] border border-white/10 rounded-xl w-full max-w-lg p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-sm font-bold text-white">{editing.id ? 'Editar' : 'Nova'} Promessa</h2>

            <div>
              <label className="block text-[11px] text-white/40 mb-1">Político</label>
              <select
                value={editing.politician_id || ''}
                onChange={e => setEditing({ ...editing, politician_id: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
              >
                <option value="">Selecione...</option>
                {politicians.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-white/40 mb-1">Título da promessa</label>
              <input
                value={editing.title || ''}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
                placeholder="Ex: Construir 10 creches em Palmas"
              />
            </div>

            <div>
              <label className="block text-[11px] text-white/40 mb-1">Descrição</label>
              <textarea
                value={editing.description || ''}
                onChange={e => setEditing({ ...editing, description: e.target.value })}
                rows={3}
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 resize-none"
                placeholder="Detalhes da promessa..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Área</label>
                <select
                  value={editing.area || ''}
                  onChange={e => setEditing({ ...editing, area: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
                >
                  <option value="">Selecione...</option>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Status</label>
                <select
                  value={editing.status || 'pending'}
                  onChange={e => setEditing({ ...editing, status: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
                >
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Progresso ({editing.progress_pct || 0}%)</label>
                <input
                  type="range" min="0" max="100"
                  value={editing.progress_pct || 0}
                  onChange={e => setEditing({ ...editing, progress_pct: Number(e.target.value) })}
                  className="w-full accent-green"
                />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Prazo</label>
                <input
                  type="date"
                  value={editing.deadline?.split('T')[0] || ''}
                  onChange={e => setEditing({ ...editing, deadline: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-white/40 mb-1">Fonte (URL)</label>
              <input
                value={editing.source_url || ''}
                onChange={e => setEditing({ ...editing, source_url: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
                placeholder="https://..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editing.title || !editing.politician_id}
                className="px-5 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors disabled:opacity-40"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista agrupada por político */}
      {isLoading ? (
        <p className="text-sm text-white/30">Carregando...</p>
      ) : promises.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-sm text-white/40">Nenhuma promessa cadastrada ainda</p>
          <p className="text-xs text-white/20 mt-1">Clique em "+ Nova Promessa" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([name, items]) => (
            <div key={name} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <span className="text-sm font-bold text-white">{name}</span>
                <span className="text-xs text-white/30">{items.length} promessa{items.length > 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-white/5">
                {items.map(p => (
                  <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${statusColors[p.status]}`}>
                          {statusLabels[p.status]}
                        </span>
                        {p.area && <span className="text-[10px] text-white/30">{p.area}</span>}
                      </div>
                      <p className="text-sm text-white/80 font-medium">{p.title}</p>
                      {p.description && <p className="text-xs text-white/30 mt-0.5 line-clamp-1">{p.description}</p>}
                      <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${p.status === 'done' ? 'bg-green' : p.status === 'failed' ? 'bg-red' : 'bg-blue'}`}
                          style={{ width: `${p.progress_pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-white/20 tabular-nums shrink-0">{p.progress_pct}%</span>
                    <button
                      onClick={() => setEditing(p)}
                      className="text-[11px] text-blue/70 hover:text-blue transition-colors shrink-0"
                    >✏️</button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-[11px] text-red/50 hover:text-red transition-colors shrink-0"
                    >🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
