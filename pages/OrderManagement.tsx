import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActivities, createActivity, getClients, getTenantUsers, assignActivity, updateActivityStatus, approveActivity, requestBilling, fileAccountReceivable, processPayment } from '../services/dataService';
import { Plus, Search, Filter, ChevronRight, Loader2, UserPlus, CheckCircle, Upload, FileText, DollarSign, XCircle } from 'lucide-react';
import { Activity, Client, User, ActivityStatus } from '../types';

export const OrderManagement = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [providers, setProviders] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [supportModal, setSupportModal] = useState<string | null>(null);

  // Forms
  const [formData, setFormData] = useState({ clientId: '', type: '', priority: 'medium', comments: '' });
  const [selectedProvider, setSelectedProvider] = useState('');

  const isBillingView = window.location.hash.includes('billing');

  const loadData = async () => {
    if(user && user.tenantId) {
        setIsLoading(true);
        const [acts, clis, users] = await Promise.all([
            getActivities(user),
            getClients(user),
            getTenantUsers(user.tenantId)
        ]);
        setActivities(acts);
        setClients(clis);
        setProviders(users.filter(u => u.role === 'provider'));
        setIsLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [user]);

  // --- ACTIONS HANDLERS ---

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user) return;
    await createActivity({
      clientId: formData.clientId,
      activityType: formData.type,
      priority: formData.priority as any,
      comments: formData.comments
    }, user);
    setShowCreateModal(false);
    loadData();
  };

  const handleAssign = async () => {
      if(!assignModal || !selectedProvider) return;
      await assignActivity(assignModal, selectedProvider);
      setAssignModal(null);
      loadData();
  }

  const handleFinalize = async () => {
      if(!supportModal) return;
      // Mock Support Upload
      const mockSupport = [{ name: 'Acta_Final.pdf', url: '#', date: new Date().toISOString() }];
      await updateActivityStatus(supportModal, ActivityStatus.Finalized, mockSupport);
      setSupportModal(null);
      loadData();
  }

  const handleApprove = async (act: Activity) => {
      if(!confirm("¿Aprobar actividad y generar Orden de Servicio?")) return;
      if(!user) return;
      await approveActivity(act, user);
      loadData();
  }

  const handleRequestBilling = async (id: string) => {
      if(!user) return;
      await requestBilling(id, user.id);
      loadData();
  }

  const handleFileReceivable = async (id: string) => {
      await fileAccountReceivable(id);
      loadData();
  }

  const handlePayment = async (id: string, status: 'paid' | 'rejected') => {
      await processPayment(id, status);
      loadData();
  }

  // --- RENDER HELPERS ---

  const getStatusBadge = (status: ActivityStatus) => {
      const config: any = {
          [ActivityStatus.PendingAssignment]: { color: 'bg-amber-100 text-amber-700', label: 'Pendiente Asignar' },
          [ActivityStatus.Assigned]: { color: 'bg-blue-100 text-blue-700', label: 'Asignada' },
          [ActivityStatus.InExecution]: { color: 'bg-blue-100 text-blue-700', label: 'En Ejecución' },
          [ActivityStatus.Finalized]: { color: 'bg-indigo-100 text-indigo-700', label: 'Finalizada / Revisión' },
          [ActivityStatus.Approved]: { color: 'bg-green-100 text-green-700', label: 'Aprobada / OS Generada' },
          [ActivityStatus.BillingRequested]: { color: 'bg-purple-100 text-purple-700', label: 'Facturación Solicitada' },
          [ActivityStatus.AccountReceivableFiled]: { color: 'bg-orange-100 text-orange-700', label: 'Cta. Cobro Radicada' },
          [ActivityStatus.Paid]: { color: 'bg-emerald-100 text-emerald-800', label: 'Pagada' },
      };
      const c = config[status] || { color: 'bg-gray-100', label: status };
      return <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.color}`}>{c.label}</span>;
  }

  // --- FILTER LOGIC ---
  const filteredActivities = activities.filter(a => {
      if(isBillingView) {
          // Accountant only sees billing related
          return [ActivityStatus.Approved, ActivityStatus.BillingRequested, ActivityStatus.AccountReceivableFiled, ActivityStatus.Paid].includes(a.status);
      }
      return true;
  });

  if (!user) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{isBillingView ? 'Facturación y Pagos' : 'Gestión de Actividades'}</h2>
          <p className="text-slate-500 text-sm">Flujo de trabajo: {user.role}</p>
        </div>
        {!isBillingView && ['analyst', 'coordinator', 'admin'].includes(user.role) && (
            <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm">
            <Plus size={18} /> Nueva Solicitud
            </button>
        )}
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">
        {isLoading ? (
            <div className="flex items-center justify-center h-40 text-slate-500 gap-2"><Loader2 className="animate-spin"/> Cargando...</div>
        ) : (
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                    <th className="px-6 py-4">ID / Tipo</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Asignado a</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones Disponibles</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredActivities.map((act) => {
                    const client = clients.find(c => c.id === act.clientId);
                    const provider = providers.find(p => p.id === act.assignedProviderId);
                    
                    return (
                    <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">#{act.id.slice(-4)}</div>
                            <div className="text-xs text-slate-500">{act.activityType}</div>
                            {act.serviceOrderId && <div className="text-xs text-purple-600 font-mono mt-1">OS: {act.serviceOrderId}</div>}
                        </td>
                        <td className="px-6 py-4">
                            <div className="font-medium">{client?.name || '---'}</div>
                            <div className="text-xs text-slate-500">{act.requestDate}</div>
                        </td>
                        <td className="px-6 py-4">
                            {provider ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{provider.name.charAt(0)}</div>
                                    <span className="text-slate-700">{provider.name}</span>
                                </span>
                            ) : <span className="text-slate-400 italic">Sin Asignar</span>}
                        </td>
                        <td className="px-6 py-4">
                            {getStatusBadge(act.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                {/* ACTION: ASSIGN (Coordinator) */}
                                {act.status === ActivityStatus.PendingAssignment && ['coordinator', 'admin'].includes(user.role) && (
                                    <button onClick={() => setAssignModal(act.id)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 flex items-center gap-1">
                                        <UserPlus size={14}/> Asignar
                                    </button>
                                )}

                                {/* ACTION: EXECUTE/FINALIZE (Provider) */}
                                {['assigned', 'in_execution'].includes(act.status) && user.role === 'provider' && act.assignedProviderId === user.id && (
                                    <button onClick={() => updateActivityStatus(act.id, ActivityStatus.InExecution)} className="px-3 py-1 bg-amber-50 text-amber-600 rounded border border-amber-200 hover:bg-amber-100">
                                        Iniciar
                                    </button>
                                )}
                                {act.status === ActivityStatus.InExecution && user.role === 'provider' && act.assignedProviderId === user.id && (
                                    <button onClick={() => setSupportModal(act.id)} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1">
                                        <Upload size={14}/> Finalizar
                                    </button>
                                )}

                                {/* ACTION: APPROVE (Coordinator) */}
                                {act.status === ActivityStatus.Finalized && ['coordinator', 'admin'].includes(user.role) && (
                                    <button onClick={() => handleApprove(act)} className="px-3 py-1 bg-green-50 text-green-600 rounded border border-green-200 hover:bg-green-100 flex items-center gap-1">
                                        <CheckCircle size={14}/> Aprobar & Generar OS
                                    </button>
                                )}

                                {/* ACTION: REQUEST BILLING (Coordinator) */}
                                {act.status === ActivityStatus.Approved && ['coordinator', 'admin'].includes(user.role) && (
                                    <button onClick={() => handleRequestBilling(act.id)} className="px-3 py-1 bg-purple-50 text-purple-600 rounded border border-purple-200 hover:bg-purple-100 flex items-center gap-1">
                                        <DollarSign size={14}/> Solicitar Fac.
                                    </button>
                                )}

                                {/* ACTION: FILE RECEIVABLE (Provider) */}
                                {act.status === ActivityStatus.BillingRequested && user.role === 'provider' && (
                                    <button onClick={() => handleFileReceivable(act.id)} className="px-3 py-1 bg-orange-50 text-orange-600 rounded border border-orange-200 hover:bg-orange-100 flex items-center gap-1">
                                        <FileText size={14}/> Radicar Cta. Cobro
                                    </button>
                                )}

                                {/* ACTION: PAY (Accountant) */}
                                {act.status === ActivityStatus.AccountReceivableFiled && ['accountant', 'admin'].includes(user.role) && (
                                    <div className="flex gap-1">
                                        <button onClick={() => handlePayment(act.id, 'paid')} className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                                            Pagar
                                        </button>
                                        <button onClick={() => handlePayment(act.id, 'rejected')} className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200">
                                            Rechazar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </td>
                    </tr>
                )})}
            </tbody>
            </table>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Nueva Solicitud</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    <select required className="w-full border p-2 rounded" onChange={e => setFormData({...formData, clientId: e.target.value})}>
                        <option value="">Seleccionar Cliente</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input required placeholder="Tipo de Actividad" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, type: e.target.value})}/>
                    <select className="w-full border p-2 rounded" onChange={e => setFormData({...formData, priority: e.target.value})}>
                        <option value="medium">Prioridad Media</option>
                        <option value="high">Prioridad Alta</option>
                        <option value="low">Prioridad Baja</option>
                    </select>
                    <textarea placeholder="Comentarios..." className="w-full border p-2 rounded" onChange={e => setFormData({...formData, comments: e.target.value})}/>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Crear</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {assignModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                 <h3 className="font-bold mb-4">Asignar Consultor</h3>
                 <select className="w-full border p-2 rounded mb-4" onChange={e => setSelectedProvider(e.target.value)}>
                     <option value="">Seleccionar...</option>
                     {providers.map(p => <option key={p.id} value={p.id}>{p.name} - {p.profession}</option>)}
                 </select>
                 <div className="flex justify-end gap-2">
                     <button onClick={() => setAssignModal(null)} className="px-4 py-2 text-slate-600">Cancelar</button>
                     <button onClick={handleAssign} className="px-4 py-2 bg-blue-600 text-white rounded">Confirmar</button>
                 </div>
             </div>
          </div>
      )}

      {/* SUPPORT MODAL (Mock) */}
      {supportModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
                  <Upload className="mx-auto text-blue-500 mb-4" size={48}/>
                  <h3 className="font-bold mb-2">Cargar Entregables</h3>
                  <p className="text-sm text-slate-500 mb-4">Para finalizar la actividad, debes cargar los soportes requeridos.</p>
                  <div className="border-2 border-dashed border-slate-300 rounded p-8 mb-4 bg-slate-50">
                      <p className="text-xs text-slate-400">Simulación: El archivo "Acta_Final.pdf" se adjuntará automáticamente.</p>
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setSupportModal(null)} className="px-4 py-2 text-slate-600">Cancelar</button>
                      <button onClick={handleFinalize} className="px-4 py-2 bg-green-600 text-white rounded">Finalizar y Subir</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};