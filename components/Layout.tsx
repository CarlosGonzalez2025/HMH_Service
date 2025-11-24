import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Briefcase, Users, Settings, Activity as ActivityIcon, Building2, FileText, UserPlus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, tenant, logout } = useAuth();
  const location = useLocation();

  if (!user) return <>{children}</>;

  const getNavItems = () => {
    if (user.role === 'superAdmin') {
      return [
        { label: 'SaaS Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
        { label: 'Empresas', icon: <Building2 size={20} />, path: '/tenants' },
        { label: 'Global Settings', icon: <Settings size={20} />, path: '/settings' },
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

    return items;
  };

  const navItems = getNavItems();
  
  const displayName = user.name || 'Usuario';
  const displayInitial = (displayName || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-tight text-blue-400">
            {user.role === 'superAdmin' ? 'SaaS HMH Admin' : (tenant?.name || 'HMH Platform')}
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{user.role}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
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
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
              {displayInitial}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
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
        <header className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-slate-800">
               Portal de Gestión
            </h2>
            {tenant && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                    Tenant ID: {tenant.id}
                </span>
            )}
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};