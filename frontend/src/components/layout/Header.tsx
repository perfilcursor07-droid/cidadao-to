import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { to: '/', label: 'Início' },
  { to: '/politicians', label: 'Políticos' },
  { to: '/promises', label: 'Promessas' },
  { to: '/news', label: 'Notícias' },
  { to: '/diario', label: 'Diário Oficial' },
];

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Top row: logo + auth */}
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <span className="text-lg font-extrabold text-ink leading-none tracking-tight">
                cidadão<span className="text-green">.to</span>
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const active = location.pathname === link.to ||
                (link.to !== '/' && location.pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                    active
                      ? 'text-green bg-green/5'
                      : 'text-ink2 hover:text-green hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-green/10 flex items-center justify-center">
                    <span className="text-green text-xs font-bold">{user?.name?.[0]}</span>
                  </div>
                  <span className="text-xs text-ink2 font-medium">{user?.name?.split(' ')[0]}</span>
                </div>
                <button onClick={logout} className="text-xs text-muted hover:text-red transition-colors">
                  Sair
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-[13px] bg-green text-white px-4 py-1.5 rounded-lg font-medium hover:bg-green-dark transition-colors">
                Entrar
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1"
              aria-label="Menu"
            >
              <span className={`block w-5 h-[2px] bg-ink transition-transform ${mobileOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
              <span className={`block w-5 h-[2px] bg-ink transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-[2px] bg-ink transition-transform ${mobileOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border overflow-hidden bg-white"
          >
            <div className="px-4 py-2 space-y-0.5">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm text-ink2 hover:bg-gray-50 hover:text-green transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
