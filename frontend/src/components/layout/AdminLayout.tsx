import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const menuItems = [
  { to: '/admin', icon: '📊', label: 'Dashboard', exact: true },
  { to: '/admin/diario', icon: '📰', label: 'Diário Oficial' },
  { to: '/admin/politicians', icon: '🏛️', label: 'Políticos' },
  { to: '/admin/promises', icon: '📋', label: 'Promessas' },
  { to: '/admin/nepotism', icon: '🔍', label: 'Nepotismo' },
  { to: '/admin/polls', icon: '📊', label: 'Enquetes' },
  { to: '/admin/users', icon: '👥', label: 'Usuários' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-[#0f1117]">
      {/* Sidebar */}
      <aside className="w-[220px] bg-[#0f1117] border-r border-white/5 flex flex-col fixed h-screen z-50">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <span className="text-sm font-extrabold text-white leading-none">
                cidadão<span className="text-green">.to</span>
              </span>
              <span className="block text-[10px] text-white/40 font-medium">ADMIN</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {menuItems.map(item => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  active
                    ? 'bg-green/10 text-green'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green/20 flex items-center justify-center">
              <span className="text-green text-xs font-bold">{user.name[0]}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/80 truncate">{user.name}</p>
              <p className="text-[10px] text-white/30 truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="flex-1 text-center text-[11px] text-white/40 hover:text-white/70 border border-white/10 rounded-md py-1.5 transition-colors"
            >
              Ver site
            </Link>
            <button
              onClick={logout}
              className="flex-1 text-[11px] text-red/70 hover:text-red border border-red/10 rounded-md py-1.5 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-[220px] bg-[#13151d] min-h-screen">
        <div className="max-w-[1100px] mx-auto px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
