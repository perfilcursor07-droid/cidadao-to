import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-12">
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-green rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="text-base font-extrabold text-ink">cidadão<span className="text-green">.to</span></span>
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-sm">
              Portal de transparência democrática do Tocantins. Jornalismo de dados, IA e participação popular.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Navegação</h4>
            <ul className="space-y-2">
              {[
                { to: '/politicians', label: 'Políticos' },
                { to: '/promises', label: 'Promessas' },
                { to: '/news', label: 'Notícias' },
                { to: '/diario', label: 'Diário Oficial' },
              ].map(l => (
                <li key={l.to}><Link to={l.to} className="text-sm text-ink2 hover:text-green transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Sobre</h4>
            <ul className="space-y-2 text-sm text-ink2">
              <li>Dados abertos</li>
              <li>Código aberto</li>
              <li>Sem fins lucrativos</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} Cidadão.TO — Todos os direitos reservados
        </div>
      </div>
    </footer>
  );
}
