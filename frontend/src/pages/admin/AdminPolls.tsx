import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface PollForm {
  id?: number;
  title: string;
  description: string;
  options: string[];
  active: boolean;
  ends_at: string;
}

const empty: PollForm = { title: '', description: '', options: ['', ''], active: true, ends_at: '' };

export default function AdminPolls() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PollForm | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: polls = [], isLoading } = useQuery({
    queryKey: ['admin-polls'],
    queryFn: () => api.get('/admin/polls').then(r => r.data),
  });

  const handleSave = async () => {
    if (!editing || !editing.title || editing.options.filter(o => o.trim()).length < 2) return;
    setSaving(true);
    try {
      const payload = { ...editing, options: editing.options.filter(o => o.trim()) };
      if (editing.id) await api.put(`/admin/polls/${editing.id}`, payload);
      else await api.post('/admin/polls', payload);
      qc.invalidateQueries({ queryKey: ['admin-polls'] });
      setEditing(null);
    } catch (err: any) { alert(err?.response?.data?.error || 'Erro'); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover enquete e todos os votos?')) return;
    await api.delete(`/admin/polls/${id}`);
    qc.invalidateQueries({ queryKey: ['admin-polls'] });
  };

  const addOption = () => {
    if (!editing || editing.options.length >= 10) return;
    setEditing({ ...editing, options: [...editing.options, ''] });
  };

  const removeOption = (i: number) => {
    if (!editing || editing.options.length <= 2) return;
    setEditing({ ...editing, options: editing.options.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">📊 Enquetes</h1>
          <p className="text-sm text-white/40 mt-0.5">{polls.length} enquetes cadastradas</p>
        </div>
        <button onClick={() => setEditing({ ...empty })}
          className="px-5 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors">
          + Nova Enquete
        </button>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-[#1a1d27] border border-white/10 rounded-xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-sm font-bold text-white">{editing.id ? 'Editar' : 'Nova'} Enquete</h2>

            <div>
              <label className="block text-[11px] text-white/40 mb-1">Pergunta</label>
              <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
                placeholder="Ex: Qual a prioridade para Palmas em 2026?" />
            </div>

            <div>
              <label className="block text-[11px] text-white/40 mb-1">Descrição (opcional)</label>
              <textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}
                rows={2} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 resize-none"
                placeholder="Contexto da enquete..." />
            </div>

            <div>
              <label className="block text-[11px] text-white/40 mb-1">Opções ({editing.options.length})</label>
              <div className="space-y-2">
                {editing.options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-xs text-white/20 mt-2.5 w-5 shrink-0">{i + 1}.</span>
                    <input value={opt}
                      onChange={e => { const opts = [...editing.options]; opts[i] = e.target.value; setEditing({ ...editing, options: opts }); }}
                      className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
                      placeholder={`Opção ${i + 1}`} />
                    {editing.options.length > 2 && (
                      <button onClick={() => removeOption(i)} className="text-red/50 hover:text-red text-xs px-2">✕</button>
                    )}
                  </div>
                ))}
              </div>
              {editing.options.length < 10 && (
                <button onClick={addOption} className="text-xs text-green mt-2 hover:underline">+ Adicionar opção</button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Encerra em (opcional)</label>
                <input type="datetime-local" value={editing.ends_at}
                  onChange={e => setEditing({ ...editing, ends_at: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.active}
                    onChange={e => setEditing({ ...editing, active: e.target.checked })}
                    className="accent-green" />
                  <span className="text-xs text-white/60">Ativa</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-white/40 hover:text-white/70">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !editing.title}
                className="px-5 py-2 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark disabled:opacity-40">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {isLoading ? <p className="text-sm text-white/30">Carregando...</p> : polls.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm text-white/40">Nenhuma enquete cadastrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map((p: any) => (
            <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${p.active ? 'bg-green/10 text-green' : 'bg-white/5 text-white/30'}`}>
                      {p.active ? 'Ativa' : 'Encerrada'}
                    </span>
                    <span className="text-xs text-white/30">{p.totalVotes} votos</span>
                  </div>
                  <h3 className="text-sm font-bold text-white/80">{p.title}</h3>
                  {p.description && <p className="text-xs text-white/30 mt-0.5">{p.description}</p>}
                  <div className="mt-2 space-y-1">
                    {(p.options || []).map((opt: string, i: number) => (
                      <div key={i} className="text-[11px] text-white/40 flex items-center gap-2">
                        <span className="w-4 text-white/20">{i + 1}.</span>
                        <span>{typeof opt === 'string' ? opt : (opt as any)?.text || opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing({ id: p.id, title: p.title, description: p.description || '', options: (p.options || []).map((o: any) => typeof o === 'string' ? o : o.text), active: p.active, ends_at: p.ends_at ? new Date(p.ends_at).toISOString().slice(0, 16) : '' })}
                    className="text-xs text-white/20 hover:text-white/60">✏️</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs text-white/20 hover:text-red">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
