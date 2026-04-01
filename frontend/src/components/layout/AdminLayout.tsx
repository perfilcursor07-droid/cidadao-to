import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const menuItems = [
  { to: '/admin', icon: '📊', label: 'Dashboard', exact: true },
  { to: '/admin/diario', icon: '📜', label: 'Diário Oficial' },
  { to: '/admin/politicians', icon: '🏛️', label: 'Políticos' },
  { to: '/admin/promises', icon: '📋', label: 'Promessas' },
  { to: '/admin/nepotism', icon: '🔗', label: 'Vínculos Familiares' },
  { to: '/admin/expenses', icon: '💰', label: 'Gastos' },
  { to: '/admin/polls', icon: '📊', label: 'Enquetes' },
  { to: '/admin/users', icon: '👥', label: 'Usuários' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const sideW = collapsed ? 'w-[68px]' : 'w-[230px]';
  const mlW = collapsed ? 'ml-[68px]' : 'ml-[230px]';

  return (
    <div className="min-h-screen flex bg-[#0c0e14]">
      {/* Sidebar */}
      <aside className={`${sideW} bg-[#0f1117] border-r border-white/[0.04] flex flex-col fixed h-screen z-50 transition-all duration-300`}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-green to-green-dark rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-green/20">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
                <span className="text-sm font-extrabold text-white leading-none block">
                  cidadão<span className="text-green">.to</span>
                </span>
                <span className="text-[9px] text-white/30 font-medium tracking-wider">PAINEL ADMIN</span>
              </motion.div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-white/20 hover:text-white/50 transition-colors text-xs p-1"
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className="text-[9px] text-white/20 font-semibold uppercase tracking-widest px-2.5 mb-2">Menu</p>
          )}
          {menuItems.map(item => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? 'bg-green/10 text-green'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="admin-nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-green rounded-r-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className={`text-base ${collapsed ? 'mx-auto' : ''}`}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Separator */}
        {!collapsed && (
          <div className="px-4 py-2">
            <div className="h-px bg-white/[0.04]" />
          </div>
        )}

        {/* User / Logout */}
        <div className="px-3 py-3 border-t border-white/[0.04]">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green/30 to-green/10 flex items-center justify-center">
                <span className="text-green text-xs font-bold">{user.name[0]}</span>
              </div>
              <button onClick={logout} className="text-[10px] text-red/50 hover:text-red transition-colors" title="Sair">
                ⏻
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 mb-3 px-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green/30 to-green/10 flex items-center justify-center shrink-0">
                  <span className="text-green text-xs font-bold">{user.name[0]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white/70 truncate">{user.name}</p>
                  <p className="text-[10px] text-white/25 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Link
                  to="/"
                  className="flex-1 text-center text-[10px] text-white/30 hover:text-white/60 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-md py-1.5 transition-all"
                >
                  ← Ver site
                </Link>
                <button
                  onClick={logout}
                  className="flex-1 text-[10px] text-red/50 hover:text-red bg-red/[0.03] hover:bg-red/[0.06] border border-red/[0.06] rounded-md py-1.5 transition-all"
                >
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 ${mlW} bg-[#12141c] min-h-screen transition-all duration-300`}>
        {/* Topbar */}
        <div className="sticky top-0 z-40 bg-[#12141c]/80 backdrop-blur-md border-b border-white/[0.04] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {menuItems.map(item => {
              const active = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              if (!active) return null;
              return (
                <span key={item.to} className="text-sm font-semibold text-white/70 flex items-center gap-2">
                  <span>{item.icon}</span> {item.label}
                </span>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] text-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              Online
            </span>
          </div>
        </div>

        {/* Page content */}
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [.22, 1, .36, 1] }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
