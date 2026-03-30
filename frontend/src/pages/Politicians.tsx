import { useState } from 'react';
import { usePoliticians } from '../hooks/usePoliticians';
import PoliticianCard from '../components/politicians/PoliticianCard';
import PageTitle from '../components/shared/PageTitle';

const roles = ['', 'governador', 'senador', 'dep_federal', 'dep_estadual', 'prefeito', 'vereador'];
const roleLabels: Record<string, string> = { '': 'Todos', governador: 'Governador', senador: 'Senador', dep_federal: 'Dep. Federal', dep_estadual: 'Dep. Estadual', prefeito: 'Prefeito(a)', vereador: 'Vereador(a)' };

export default function Politicians() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const filters: Record<string, string> = {};
  if (search) filters.search = search;
  if (role) filters.role = role;

  const { data: politicians, isLoading } = usePoliticians(filters);

  return (
    <div>
      <PageTitle title="Políticos do Tocantins" subtitle="Acompanhe, vote e avalie seus representantes" />

      <div className="bg-white border border-border rounded-lg p-4 mb-6 flex flex-col md:flex-row gap-3">
        <input
          type="text" placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-green/20 w-full md:w-64"
        />
        <div className="flex flex-wrap gap-1.5">
          {roles.map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                role === r ? 'bg-green text-white' : 'bg-surface text-muted hover:text-ink hover:bg-gray-100'
              }`}>
              {roleLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted text-sm">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {politicians?.map(p => <PoliticianCard key={p.id} politician={p} />)}
          {politicians?.length === 0 && <p className="text-muted text-sm col-span-full text-center py-16">Nenhum político encontrado.</p>}
        </div>
      )}
    </div>
  );
}
