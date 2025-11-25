
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getTenants, updateTenant, createTenant, getGlobalUsers, toggleUserBlock, getInvoices, getPlanLimits } from '../services/dataService';
import { 
    Building, DollarSign, Users, Activity, Settings, 
    AlertTriangle, CheckCircle, XCircle, Search, 
    MoreVertical, Plus, FileText, Lock, Unlock,
    TrendingUp, Shield
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Tenant, User, Invoice, PlanType } from '../types';

export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tenants' | 'users' | 'finance'>('dashboard');
  
  // Data State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [globalUsers, setGlobalUsers] = useState<User[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Create Form State
  const [newTenant, setNewTenant] = useState({
      name: '', taxId: '', email: '', adminName: '', plan: 'basic' as PlanType
  });

  const loadAllData = async () => {
    setLoading(true);
    const [t, u, i] = await Promise.all([
        getTenants(user!),
        getGlobalUsers(user!),
        getInvoices()
    ]);
    setTenants(t);
    setGlobalUsers(u);
    setInvoices(i);
    setLoading(false);
  };

  useEffect(() => {
    if(user) loadAllData();
  }, [user]);

  // --- ACTIONS ---

  const handleCreateTenant = async (e: React.FormEvent) => {
      e.preventDefault();
      const limits = getPlanLimits(newTenant.plan);
      const success = await createTenant({
          name: newTenant.name,
          taxId: newTenant.taxId,
          plan: newTenant.plan,
          contactEmail: newTenant.email,
          nextBillingDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // +30 days
      }, {
          email: newTenant.email,
          name: newTenant.adminName
      });

      if(success) {
          showToast("Empresa creada exitosamente.", "success");
          setIsCreateModalOpen(false);
          loadAllData();
      } else {
          showToast("Error al crear empresa.", "error");
      }
  };

  const handleUpdateTenant = async (id: string, updates: Partial<Tenant>) => {
      if(!confirm("¿Confirmar cambio en la empresa?")) return;
      await updateTenant(id, updates);
      showToast("Empresa actualizada", "success");
      loadAllData();
      setEditingTenant(null);
  };

  const handleToggleBlockUser = async (u: User) => {
      if(!confirm(`¿${u.status === 'blocked' ? 'Desbloquear' : 'Bloquear'} usuario ${u.email}?`)) return;
      await toggleUserBlock(u.id, u.status);
      showToast(`Usuario ${u.status === 'blocked' ? 'desbloqueado' : 'bloqueado'}`, "info");
      loadAllData();
  };

  // --- SUB-COMPONENTS ---

  const KPICard = ({ title, value, sub, icon, color }: any) => (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
              <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
              <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
              {sub && <p className={`text-xs mt-2 ${sub.includes('+') ? 'text-green-600' : 'text-slate-400'}`}>{sub}</p>}
          </div>
          <div className={`p-3 rounded-lg ${color} text-white shadow-md`}>{icon}</div>
      </div>
  );

  // --- RENDER TABS ---

  const renderDashboard = () => {
      const totalRevenue = invoices.reduce((acc, curr) => acc + curr.amount, 0);
      const activeTenants = tenants.filter(t => t.status === 'active').length;

      return (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <KPICard title="MRR (Ingresos Recurrentes)" value={`$${(totalRevenue/1000000).toFixed(1)}M`} sub="+12% vs mes anterior" icon={<DollarSign/>} color="bg-emerald-600" />
                  <KPICard title="Empresas Activas" value={activeTenants} sub={`${tenants.length} registradas total`} icon={<Building/>} color="bg-blue-600" />
                  <KPICard title="Usuarios Globales" value={globalUsers.length} sub="En todos los tenants" icon={<Users/>} color="bg-indigo-600" />
                  <KPICard title="Alertas Sistema" value="2" sub="Requieren atención" icon={<AlertTriangle/>} color="bg-amber-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
                      <h4 className="font-bold text-slate-700 mb-4">Crecimiento de Ingresos (6 Meses)</h4>
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                              {name: 'May', val: 3.5}, {name: 'Jun', val: 3.8}, {name: 'Jul', val: 4.2},
                              {name: 'Ago', val: 4.0}, {name: 'Sep', val: 4.5}, {name: 'Oct', val: 5.2}
                          ]}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                             <XAxis dataKey="name" axisLine={false} tickLine={false} />
                             <YAxis axisLine={false} tickLine={false} unit="M"/>
                             <Tooltip />
                             <Line type="monotone" dataKey="val" stroke="#059669" strokeWidth={3} dot={{r:4}} />
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
                      <h4 className="font-bold text-slate-700 mb-4">Distribución por Plan</h4>
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                              {name: 'Básico', count: tenants.filter(t=>t.plan==='basic').length},
                              {name: 'Intermedio', count: tenants.filter(t=>t.plan==='intermediate').length},
                              {name: 'Enterprise', count: tenants.filter(t=>t.plan==='enterprise').length},
                          ]}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
                             <XAxis dataKey="name" />
                             <YAxis allowDecimals={false} />
                             <Tooltip cursor={{fill: '#f1f5f9'}} />
                             <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} barSize={50} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>
      );
  };

  const renderTenants = () => (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex gap-2">
                 <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 text-slate-400 w-4 h-4"/>
                    <input type="text" placeholder="Buscar Empresa..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-64"/>
                 </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm">
                  <Plus size={16}/> Nueva Empresa
              </button>
          </div>
          <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                      <th className="px-6 py-3">Empresa / NIT</th>
                      <th className="px-6 py-3">Plan</th>
                      <th className="px-6 py-3">Usuarios</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Próx. Factura</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {tenants.map(t => {
                      const limits = getPlanLimits(t.plan);
                      const usagePct = (t.userCount / limits.users) * 100;
                      return (
                          <tr key={t.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4">
                                  <div className="font-semibold text-slate-800">{t.name}</div>
                                  <div className="text-xs text-slate-500">{t.taxId}</div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                                      t.plan === 'enterprise' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                      t.plan === 'intermediate' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}>
                                      {t.plan}
                                  </span>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                          <div className={`h-full ${usagePct > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${usagePct}%`}}></div>
                                      </div>
                                      <span className="text-xs text-slate-600">{t.userCount}/{limits.users === 9999 ? 'Inf' : limits.users}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  {t.status === 'active' 
                                      ? <span className="flex items-center gap-1 text-green-600 font-medium text-xs"><CheckCircle size={14}/> Activo</span>
                                      : <span className="flex items-center gap-1 text-red-600 font-medium text-xs"><XCircle size={14}/> Susp.</span>
                                  }
                              </td>
                              <td className="px-6 py-4 text-slate-500">{t.nextBillingDate}</td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                      {editingTenant?.id === t.id ? (
                                          <div className="flex gap-1">
                                              <button onClick={() => setEditingTenant(null)} className="px-2 py-1 text-xs border rounded">Cancelar</button>
                                              <button onClick={() => handleUpdateTenant(t.id, { plan: editingTenant.plan, status: editingTenant.status })} className="px-2 py-1 text-xs bg-green-600 text-white rounded">Guardar</button>
                                          </div>
                                      ) : (
                                          <button onClick={() => setEditingTenant(t)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Settings size={16}/></button>
                                      )}
                                  </div>
                                  {editingTenant?.id === t.id && (
                                      <div className="mt-2 text-left bg-white border rounded p-2 absolute right-10 shadow-lg z-10 w-48">
                                          <label className="block text-xs font-bold mb-1">Cambiar Plan</label>
                                          <select 
                                              className="w-full text-xs border rounded mb-2 p-1"
                                              value={editingTenant.plan}
                                              onChange={(e) => setEditingTenant({...editingTenant, plan: e.target.value as PlanType})}
                                          >
                                              <option value="basic">Básico</option>
                                              <option value="intermediate">Intermedio</option>
                                              <option value="enterprise">Enterprise</option>
                                          </select>
                                          <label className="block text-xs font-bold mb-1">Estado</label>
                                          <select 
                                              className="w-full text-xs border rounded p-1"
                                              value={editingTenant.status}
                                              onChange={(e) => setEditingTenant({...editingTenant, status: e.target.value as any})}
                                          >
                                              <option value="active">Activo</option>
                                              <option value="suspended">Suspendido</option>
                                          </select>
                                      </div>
                                  )}
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
      </div>
  );

  const renderUsers = () => (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-700">Usuarios Globales</h3>
              <p className="text-xs text-slate-500">Gestión centralizada de accesos de todos los tenants</p>
          </div>
          <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                      <th className="px-6 py-3">Usuario</th>
                      <th className="px-6 py-3">Tenant</th>
                      <th className="px-6 py-3">Rol</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {globalUsers.map(u => {
                      const userTenant = tenants.find(t => t.id === u.tenantId);
                      return (
                          <tr key={u.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4">
                                  <div className="font-medium text-slate-800">{u.name}</div>
                                  <div className="text-xs text-slate-500">{u.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                  {userTenant ? (
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                                          {userTenant.name}
                                      </span>
                                  ) : (
                                      <span className="text-xs text-slate-400 font-style-italic">SuperAdmin / Global</span>
                                  )}
                              </td>
                              <td className="px-6 py-4 text-xs font-mono text-slate-600">{u.role}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      u.status === 'active' ? 'bg-green-100 text-green-700' :
                                      u.status === 'blocked' ? 'bg-red-100 text-red-700' :
                                      'bg-slate-100 text-slate-500'
                                  }`}>
                                      {u.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4">
                                  {u.role !== 'superAdmin' && (
                                      <button 
                                          onClick={() => handleToggleBlockUser(u)}
                                          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
                                              u.status === 'blocked' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-600 hover:bg-red-100'
                                          }`}
                                      >
                                          {u.status === 'blocked' ? <Unlock size={12}/> : <Lock size={12}/>}
                                          {u.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                                      </button>
                                  )}
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
      </div>
  );

  const renderFinance = () => (
      <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KPICard title="Total Facturado (Año)" value="$145.2M" sub="COP" icon={<FileText/>} color="bg-indigo-500" />
              <KPICard title="Pagos Pendientes" value="$3.5M" sub="2 facturas vencidas" icon={<AlertTriangle/>} color="bg-red-500" />
              <KPICard title="Ticket Promedio" value="$1.2M" sub="Por tenant" icon={<TrendingUp/>} color="bg-emerald-500" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-700">Historial de Facturas</h3>
              </div>
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <tr>
                          <th className="px-6 py-3">ID Factura</th>
                          <th className="px-6 py-3">Empresa</th>
                          <th className="px-6 py-3">Concepto</th>
                          <th className="px-6 py-3">Fecha</th>
                          <th className="px-6 py-3">Monto</th>
                          <th className="px-6 py-3">Estado</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {invoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-mono text-slate-600">{inv.id}</td>
                              <td className="px-6 py-4 font-medium">{inv.tenantName}</td>
                              <td className="px-6 py-4 text-slate-500">{inv.concept}</td>
                              <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                              <td className="px-6 py-4 font-bold text-slate-700">${inv.amount.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                      inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                                      inv.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                      'bg-red-100 text-red-700'
                                  }`}>
                                      {inv.status}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  if (!user) return null;
  if (loading) return <div className="p-10 flex items-center justify-center text-slate-500">Cargando consola de administración...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Super Admin Console</h1>
        <p className="text-slate-500">Gestión centralizada de la plataforma SaaS</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-6">
          <button 
             onClick={() => setActiveTab('dashboard')}
             className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              Dashboard
          </button>
          <button 
             onClick={() => setActiveTab('tenants')}
             className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'tenants' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              Empresas (Tenants)
          </button>
          <button 
             onClick={() => setActiveTab('users')}
             className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              Usuarios Globales
          </button>
          <button 
             onClick={() => setActiveTab('finance')}
             className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'finance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              Finanzas
          </button>
      </div>

      {/* Content */}
      <div className="animate-in fade-in duration-300">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'tenants' && renderTenants()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'finance' && renderFinance()}
      </div>

      {/* Create Tenant Modal */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Building size={20}/> Registrar Nueva Empresa</h3>
                      <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle/></button>
                  </div>
                  <form onSubmit={handleCreateTenant} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1">Razón Social</label>
                              <input required type="text" className="w-full border rounded p-2 text-sm" value={newTenant.name} onChange={e => setNewTenant({...newTenant, name: e.target.value})} placeholder="Ej: Acme Corp"/>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1">NIT / Tax ID</label>
                              <input required type="text" className="w-full border rounded p-2 text-sm" value={newTenant.taxId} onChange={e => setNewTenant({...newTenant, taxId: e.target.value})} placeholder="900.000.000"/>
                          </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded border border-slate-200">
                          <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Usuario Administrador</p>
                          <div className="space-y-3">
                              <input required type="text" className="w-full border rounded p-2 text-sm" placeholder="Nombre Completo Admin" value={newTenant.adminName} onChange={e => setNewTenant({...newTenant, adminName: e.target.value})}/>
                              <input required type="email" className="w-full border rounded p-2 text-sm" placeholder="Email Corporativo" value={newTenant.email} onChange={e => setNewTenant({...newTenant, email: e.target.value})}/>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Plan Suscripción</label>
                          <select className="w-full border rounded p-2 text-sm bg-white" value={newTenant.plan} onChange={e => setNewTenant({...newTenant, plan: e.target.value as any})}>
                              <option value="basic">Básico - 5 Usuarios - $500k</option>
                              <option value="intermediate">Intermedio - 15 Usuarios - $1.5M</option>
                              <option value="enterprise">Enterprise - Ilimitado - $3M+</option>
                          </select>
                      </div>
                      <div className="flex justify-end gap-2 mt-6">
                          <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-200">Crear Empresa</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
