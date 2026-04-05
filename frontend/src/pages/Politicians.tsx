import { useState } from 'react';
import { usePoliticians } from '../hooks/usePoliticians';
import PoliticianCard from '../components/politicians/PoliticianCard';
import PageTitle from '../components/shared/PageTitle';

const roleOrder = ['governador', 'senador', 'dep_federal', 'dep_estadual', 'prefeito', 'vereador'];
const roleLabels: Record<string, string> = {
  governador: 'Governador',
  senador: 'Senador',
  dep_federal: 'Deputado Federal',
  dep_estadual: 'Deputado Estadual',
  prefeito: 'Prefeito(a)',
  vereador: 'Vereador(a)',
};

export default function Politicians() {
  const [search, setSearch] = useState('');

  const { data: politicians, isLoading } = usePoliticians({});

  const filtered = politicians?.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const grouped = roleOrder.reduce<Record<string, typeof filtered>>((acc, role) => {
    const list = filtered.filter(p => p.role === role);
    if (list.length > 0) acc[role] = list;
    return acc;
  }, {});

  return (
    <div>
      <PageTitle title="Políticos do Tocantins" subtitle="Acompanhe, vote e avalie seus representantes" />

      <div className="bg-white border border-border rounded-lg p-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-green/20 w-full md:w-80"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted text-sm">Carregando...</div>
      ) : filtered.length === 0 ? (
        <p className="text-muted text-sm text-center py-16">Nenhum político encontrado.</p>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([role, list]) => (
            <section key={role}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-base font-bold text-ink">{roleLabels[role]}</h2>
                <span className="text-xs text-muted bg-surface border border-border rounded-full px-2 py-0.5">
                  {list.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map(p => <PoliticianCard key={p.id} politician={p} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
