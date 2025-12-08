
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Briefcase, Users, Settings, Activity as ActivityIcon, Building2, FileText, UserPlus, Database, Menu, X, User as UserIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Avatar } from './Avatar';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, tenant, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const getNavItems = () => {
    if (user.role === 'superAdmin') {
      return [
        { label: 'SaaS Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
        { label: 'Empresas', icon: <Building2 size={20} />, path: '/tenants' },
      ];
    }

    // Tenant Views
    const items = [
      { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    ];

    // Admin & Coordinator: Team Management
    if (['admin', 'coordinator'].includes(user.role)) {
        items.push({ label: 'Mi Equipo', icon: <Users size={20} />, path: '/team' });
    }

    // Req 1, 2, 4: Analysts & Coordinators manage Clients and Requests
    if (['admin', 'coordinator', 'analyst'].includes(user.role)) {
        items.push({ label: 'Gestión Clientes', icon: <UserPlus size={20} />, path: '/clients' });
        items.push({ label: 'Actividades / Ordenes', icon: <Briefcase size={20} />, path: '/orders' });
    }

    // Provider View
    if (user.role === 'provider') {
        items.push({ label: 'Mis Asignaciones', icon: <ActivityIcon size={20} />, path: '/orders' });
    }

    // Accountant View (Req 10, 12)
    if (['admin', 'accountant'].includes(user.role)) {
        items.push({ label: 'Facturación / Pagos', icon: <FileText size={20} />, path: '/billing' });
    }

    // Masters Management (New Table)
    if (['admin'].includes(user.role)) {
        items.push({ label: 'Config. / Maestros', icon: <Database size={20} />, path: '/masters' });
    }

    // Settings for all users
    items.push({ label: 'Mi Perfil', icon: <UserIcon size={20} />, path: '/settings' });

    return items;
  };

  const navItems = getNavItems();

  const displayName = user.name || 'Usuario';
  const displayInitial = (displayName || user.email || 'U').charAt(0).toUpperCase();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Hidden on mobile, visible on lg+ */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 text-white flex flex-col shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Close button for mobile */}
        <div className="lg:hidden absolute top-4 right-4">
          <button
            onClick={closeMobileMenu}
            className="p-2 text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-tight text-blue-400">
            {user.role === 'superAdmin' ? 'SaaS HMH Admin' : (tenant?.name || 'HMH Platform')}
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{user.role}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <Link
            to="/settings"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 mb-4 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors group"
          >
            <Avatar
              src={user.photoURL}
              name={user.name}
              size="md"
              showOnlineIndicator
            />
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate group-hover:text-white">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">Ver perfil</p>
            </div>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu Button - Only visible on mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                Portal de Gestión
              </h2>
            </div>
            {tenant && (
                <span className="hidden sm:inline-flex px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                    Tenant ID: {tenant.id}
                </span>
            )}
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
