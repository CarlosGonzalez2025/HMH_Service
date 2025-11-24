
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActivities, createActivity, getClients, getTenantUsers, assignActivity, updateActivityStatus, createActivityApproval, requestBilling, fileAccountReceivable, processPayment, getSubClients, getActivityTypes, getActivityLogs } from '../services/dataService';
import { Plus, Search, Filter, ChevronRight, Loader2, UserPlus, CheckCircle, Upload, FileText, DollarSign, XCircle, MapPin, ClipboardList, Clock } from 'lucide-react';
import { Activity, Client, User, ActivityStatus, SubClient, ActivityTypeDefinition, ActivityLog } from '../types';

export const OrderManagement = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [providers, setProviders] = useState<User[]>([]);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeDefinition[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subClients, setSubClients] = useState<SubClient[]>([]);

  // Action Modals
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [supportModal, setSupportModal] = useState<string | null>(null); // Used for Finalizing
  const [executeModal, setExecuteModal] = useState<string | null>(null); // Used for Starting
  const [approvalModal, setApprovalModal] = useState<Activity | null>(null); // New Approval Modal

  // Logs Modal
  const [logModal, setLogModal] = useState<string | null>(null);
  const [currentLogs, setCurrentLogs] = useState<ActivityLog[]>([]);

  const [allocationPct, setAllocationPct] = useState(100); 
  const [selectedProvider, setSelectedProvider] = useState('');

  // Execution Data Form (For Bitacora)
  const [execFormData, setExecFormData] = useState({ executedUnits: 0, comment: '' });
  const [approvalComment, setApprovalComment] = useState(''); // For Approval

  // New Request Form
  const [formData, setFormData] = useState({ 
      clientId: '', 
      subClientId: '',
      activityType: '', 
      description: '',
      unit: '',
      quantity: 1,
      value: 0,
      contactName: '',
      contactPhone: '',
      coordinatorId: '',
      priority: 'medium'
  });

  const isBillingView = window.location.hash.includes('billing');
  const isProvider = user?.role === 'provider';

  const loadData = async () => {
    if(user && user.tenantId) {
        setIsLoading(true);
        const [acts, clis, users, types] = await Promise.all([
            getActivities(user),
            getClients(user),
            getTenantUsers(user.tenantId),
            getActivityTypes(user.tenantId)
        ]);
        setActivities(acts);
        setClients(clis);
        setProviders(users.filter(u => u.role === 'provider'));
        setCoordinators(users.filter(u => u.role === 'coordinator' || u.role === 'admin'));
        setActivityTypes(types);
        setIsLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [user]);

  // Handle Client Change in Create Form to load SubClients
  const handleClientChange = async (clientId: string) => {
      setFormData({...formData, clientId, subClientId: ''}); // Reset SubClient
      if(user?.tenantId && clientId) {
          const subs = await getSubClients(user.tenantId, clientId);
          setSubClients(subs);
      } else {
          setSubClients([]);
      }
  }

  const handleOpenLogs = async (actId: string) => {
      setLogModal(actId);
      const logs = await getActivityLogs(actId);
      setCurrentLogs(logs);
  }

  // --- ACTIONS HANDLERS ---

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user) return;
    await createActivity({
      clientId: formData.clientId,
      subClientId: formData.subClientId,
      activityType: formData.activityType,
      description: formData.description,
      unit: formData.unit,
      quantity: Number(formData.quantity),
      value: Number(formData.value),
      contactName: formData.contactName,
      contactPhone: formData.contactPhone,
      coordinatorId: formData.coordinatorId,
      priority: formData.priority as any
    }, user);
    setShowCreateModal(false);
    // Reset form
    setFormData({ clientId: '', subClientId: '', activityType: '', description: '', unit: '', quantity: 1, value: 0, contactName: '', contactPhone: '', coordinatorId: '', priority: 'medium' });
    loadData();
  };

  const handleAssign = async () => {
      if(!assignModal || !selectedProvider) return;
      const providerUser = providers.find(p => p.id === selectedProvider);
      if(!providerUser) return;

      await assignActivity(assignModal, providerUser, allocationPct);
      setAssignModal(null);
      setAllocationPct(100);
      loadData();
  }

  const handleStartExecution = async () => {
      if(!executeModal || !user) return;
      await updateActivityStatus(executeModal, ActivityStatus.InExecution, {
          executedUnits: Number(execFormData.executedUnits),
          comment: execFormData.comment || 'Inicio de ejecución',
          userId: user.id,
          userName: user.name
      });
      setExecuteModal(null);
      setExecFormData({ executedUnits: 0, comment: '' });
      loadData();
  }

  const handleFinalize = async () => {
      if(!supportModal || !user) return;
      // Mock Support Upload
      const mockSupport = [{ name: 'Acta_Final.pdf', url: '#', date: new Date().toISOString() }];
      
      await updateActivityStatus(supportModal, ActivityStatus.Finalized, {
          executedUnits: Number(execFormData.executedUnits),
          comment: execFormData.comment || 'Finalización de actividad',
          userId: user.id,
          userName: user.name,
          supports: mockSupport
      });
      setSupportModal(null);
      setExecFormData({ executedUnits: 0, comment: '' });
      loadData();
  }

  const handleSubmitApproval = async (approved: boolean) => {
      if(!approvalModal || !user) return;
      
      await createActivityApproval(approvalModal, user, approved, approvalComment);
      
      setApprovalModal(null);
      setApprovalComment('');
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

  const pageTitle = isBillingView ? 'Facturación y Pagos' : (isProvider ? 'Mis Asignaciones' : 'Gestión de Actividades');
  const pageSubtitle = isBillingView ? 'Gestión financiera' : (isProvider ? 'Actividades asignadas para ejecución' : `Flujo de trabajo: ${user.role}`);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{pageTitle}</h2>
          <p className="text-slate-500 text-sm">{pageSubtitle}</p>
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
                    <th className="px-6 py-4">Cliente / Ubicación</th>
                    <th className="px-6 py-4">Valores</th>
                    <th className="px-6 py-4">Responsables</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredActivities.length > 0 ? filteredActivities.map((act) => {
                    const client = clients.find(c => c.id === act.clientId);
                    const provider = providers.find(p => p.id === act.assignedProviderId);
                    const coord = coordinators.find(c => c.id === act.coordinatorId);
                    
                    return (
                    <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">#{act.orderNumber || act.id.slice(-6)}</div>
                            <div className="text-xs text-slate-500 font-medium">{act.activityType}</div>
                            {act.serviceOrderId && <div className="text-xs text-purple-600 font-mono mt-1">OS: {act.serviceOrderId}</div>}
                        </td>
                        <td className="px-6 py-4">
                            <div className="font-medium">{client?.name || '---'}</div>
                            {act.subClientId && <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10}/> Sub: {act.subClientId}</div>}
                            <div className="text-xs text-slate-400 mt-1">{act.requestDate}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-xs text-slate-600"><span className="font-bold">Cant:</span> {act.quantity} {act.unit}</div>
                            {['coordinator', 'admin', 'accountant'].includes(user.role) && (
                                <div className="text-xs font-bold text-green-600">${(act.value || 0).toLocaleString()}</div>
                            )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                             <div className="mb-1">
                                <span className="text-slate-400">Coord: </span>
                                <span className="font-medium text-slate-700">{coord?.name || '---'}</span>
                             </div>
                             {!isProvider && (
                                 <div>
                                    <span className="text-slate-400">Prov: </span>
                                    {provider ? (
                                        <span className="font-medium text-blue-600">{provider.name}</span>
                                    ) : <span className="italic text-amber-600">Pendiente</span>}
                                 </div>
                             )}
                        </td>
                        <td className="px-6 py-4">
                            {getStatusBadge(act.status)}
                            <button onClick={() => handleOpenLogs(act.id)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 mt-2">
                                <ClipboardList size={12}/> Bitácora
                            </button>
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
                                    <button onClick={() => setExecuteModal(act.id)} className="px-3 py-1 bg-amber-50 text-amber-600 rounded border border-amber-200 hover:bg-amber-100">
                                        Iniciar
                                    </button>
                                )}
                                {act.status === ActivityStatus.InExecution && user.role === 'provider' && act.assignedProviderId === user.id && (
                                    <button onClick={() => setSupportModal(act.id)} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1">
                                        <Upload size={14}/> Finalizar
                                    </button>
                                )}

                                {/* ACTION: APPROVE (Coordinator) - NOW OPENS APPROVAL MODAL */}
                                {act.status === ActivityStatus.Finalized && ['coordinator', 'admin'].includes(user.role) && (
                                    <button onClick={() => setApprovalModal(act)} className="px-3 py-1 bg-green-50 text-green-600 rounded border border-green-200 hover:bg-green-100 flex items-center gap-1">
                                        <CheckCircle size={14}/> Aprobar
                                    </button>
                                )}

                                {/* ACTION: REQUEST BILLING (Coordinator) */}
                                {act.status === ActivityStatus.Approved && ['coordinator', 'admin'].includes(user.role) && (
                                    <button onClick={() => handleRequestBilling(act.id)} className="px-3 py-1 bg-purple-50 text-purple-600 rounded border border-purple-200 hover:bg-purple-100 flex items-center gap-1">
                                        <DollarSign size={14}/> Facturar
                                    </button>
                                )}

                                {/* ACTION: FILE RECEIVABLE (Provider) */}
                                {act.status === ActivityStatus.BillingRequested && user.role === 'provider' && (
                                    <button onClick={() => handleFileReceivable(act.id)} className="px-3 py-1 bg-orange-50 text-orange-600 rounded border border-orange-200 hover:bg-orange-100 flex items-center gap-1">
                                        <FileText size={14}/> Radicar
                                    </button>
                                )}

                                {/* ACTION: PAY (Accountant) */}
                                {act.status === ActivityStatus.AccountReceivableFiled && ['accountant', 'admin'].includes(user.role) && (
                                    <div className="flex gap-1">
                                        <button onClick={() => handlePayment(act.id, 'paid')} className="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-xs">
                                            Pagar
                                        </button>
                                        <button onClick={() => handlePayment(act.id, 'rejected')} className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs">
                                            Rechazar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </td>
                    </tr>
                )}) : (
                    <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">
                            {isProvider ? 'No tienes asignaciones pendientes.' : 'No hay actividades registradas con los filtros actuales.'}
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h3 className="text-lg font-bold text-slate-800">Nueva Solicitud de Actividad</h3>
                    <button onClick={() => setShowCreateModal(false)}><XCircle className="text-slate-400 hover:text-red-500"/></button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                    {/* SECTION 1: CLIENT INFO */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Cliente *</label>
                            <select required className="w-full border p-2 rounded text-sm bg-white" onChange={e => handleClientChange(e.target.value)} value={formData.clientId}>
                                <option value="">Seleccionar Cliente</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Subcliente *</label>
                            <select required className="w-full border p-2 rounded text-sm bg-white" onChange={e => setFormData({...formData, subClientId: e.target.value})} value={formData.subClientId} disabled={!formData.clientId}>
                                <option value="">Seleccionar Sede/Subcliente</option>
                                {subClients.map(s => <option key={s.id} value={s.id}>{s.name} - {s.city}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* SECTION 2: ACTIVITY DETAILS */}
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Actividad *</label>
                            <select required className="w-full border p-2 rounded text-sm bg-white" onChange={e => setFormData({...formData, activityType: e.target.value})} value={formData.activityType}>
                                <option value="">Seleccionar Tipo...</option>
                                {activityTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Prioridad</label>
                            <select className="w-full border p-2 rounded text-sm bg-white" onChange={e => setFormData({...formData, priority: e.target.value})} value={formData.priority}>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="low">Baja</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Descripción de la Actividad</label>
                        <textarea required placeholder="Detalle lo que se debe realizar..." className="w-full border p-2 rounded text-sm h-20" onChange={e => setFormData({...formData, description: e.target.value})} value={formData.description}/>
                    </div>

                    {/* SECTION 3: ECONOMICS */}
                    <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3 rounded border border-slate-200">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Unidad *</label>
                            <input required placeholder="Ej: Horas, Visita" className="w-full border p-2 rounded text-sm" onChange={e => setFormData({...formData, unit: e.target.value})} value={formData.unit}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Cantidad *</label>
                            <input required type="number" min="1" className="w-full border p-2 rounded text-sm" onChange={e => setFormData({...formData, quantity: e.target.value})} value={formData.quantity}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Valor Total (COP)</label>
                            <input type="number" className="w-full border p-2 rounded text-sm" onChange={e => setFormData({...formData, value: e.target.value})} value={formData.value}/>
                        </div>
                    </div>

                    {/* SECTION 4: CONTACT & COORDINATOR */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Contacto Sitio</label>
                            <input placeholder="Persona que recibe" className="w-full border p-2 rounded text-sm" onChange={e => setFormData({...formData, contactName: e.target.value})} value={formData.contactName}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono Contacto</label>
                            <input placeholder="Celular" className="w-full border p-2 rounded text-sm" onChange={e => setFormData({...formData, contactPhone: e.target.value})} value={formData.contactPhone}/>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Coordinador Responsable</label>
                        <select className="w-full border p-2 rounded text-sm bg-white" onChange={e => setFormData({...formData, coordinatorId: e.target.value})} value={formData.coordinatorId}>
                            <option value="">Seleccionar Coordinador...</option>
                            {coordinators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 shadow-md">Crear Solicitud</button>
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
                 <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Consultor</label>
                        <select className="w-full border p-2 rounded text-sm" onChange={e => setSelectedProvider(e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {providers.map(p => <option key={p.id} value={p.id}>{p.name} - {p.profession}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">% Asignación</label>
                        <input type="number" min="1" max="100" className="w-full border p-2 rounded text-sm" value={allocationPct} onChange={e => setAllocationPct(Number(e.target.value))}/>
                    </div>
                 </div>
                 <div className="flex justify-end gap-2">
                     <button onClick={() => setAssignModal(null)} className="px-4 py-2 text-slate-600">Cancelar</button>
                     <button onClick={handleAssign} className="px-4 py-2 bg-blue-600 text-white rounded">Confirmar</button>
                 </div>
             </div>
          </div>
      )}

      {/* EXECUTE (START) MODAL */}
      {executeModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                 <h3 className="font-bold mb-4">Iniciar Ejecución</h3>
                 <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Unidades Ejecutadas</label>
                        <input type="number" min="0" className="w-full border p-2 rounded text-sm" value={execFormData.executedUnits} onChange={e => setExecFormData({...execFormData, executedUnits: Number(e.target.value)})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Comentario</label>
                        <textarea className="w-full border p-2 rounded text-sm h-20" placeholder="Observaciones iniciales..." value={execFormData.comment} onChange={e => setExecFormData({...execFormData, comment: e.target.value})}/>
                    </div>
                 </div>
                 <div className="flex justify-end gap-2">
                     <button onClick={() => setExecuteModal(null)} className="px-4 py-2 text-slate-600">Cancelar</button>
                     <button onClick={handleStartExecution} className="px-4 py-2 bg-amber-600 text-white rounded">Iniciar</button>
                 </div>
             </div>
          </div>
      )}

      {/* SUPPORT (FINALIZE) MODAL */}
      {supportModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
                  <Upload className="mx-auto text-blue-500 mb-4" size={48}/>
                  <h3 className="font-bold mb-2">Finalizar Actividad</h3>
                  <p className="text-sm text-slate-500 mb-4">Ingrese los datos de ejecución y cargue soportes.</p>
                  
                  <div className="text-left space-y-4 mb-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Unidades Ejecutadas</label>
                        <input type="number" min="0" className="w-full border p-2 rounded text-sm" value={execFormData.executedUnits} onChange={e => setExecFormData({...execFormData, executedUnits: Number(e.target.value)})}/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Comentarios Finales</label>
                        <textarea className="w-full border p-2 rounded text-sm h-20" value={execFormData.comment} onChange={e => setExecFormData({...execFormData, comment: e.target.value})}/>
                      </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 rounded p-4 mb-4 bg-slate-50">
                      <p className="text-xs text-slate-400">Simulación: El archivo "Acta_Final.pdf" se adjuntará.</p>
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setSupportModal(null)} className="px-4 py-2 text-slate-600">Cancelar</button>
                      <button onClick={handleFinalize} className="px-4 py-2 bg-green-600 text-white rounded">Finalizar</button>
                  </div>
              </div>
          </div>
      )}

      {/* APPROVAL MODAL */}
      {approvalModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><CheckCircle size={20}/> Aprobar Actividad</h3>
                      <button onClick={() => setApprovalModal(null)}><XCircle className="text-slate-400 hover:text-red-500"/></button>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded mb-4 text-sm">
                      <p><span className="font-bold">ID:</span> #{approvalModal.orderNumber}</p>
                      <p><span className="font-bold">Actividad:</span> {approvalModal.activityType}</p>
                      <p><span className="font-bold">Ejecutado:</span> {approvalModal.quantity} {approvalModal.unit}</p>
                  </div>

                  <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Comentarios de Aprobación / Rechazo</label>
                      <textarea 
                          className="w-full border p-2 rounded text-sm h-24" 
                          placeholder="Ingrese observaciones..." 
                          value={approvalComment} 
                          onChange={e => setApprovalComment(e.target.value)}
                      />
                  </div>

                  <div className="flex justify-between gap-3">
                      <button 
                          onClick={() => handleSubmitApproval(false)} 
                          className="flex-1 px-4 py-2 border border-red-200 bg-red-50 text-red-700 rounded text-sm font-bold hover:bg-red-100"
                      >
                          Requiere Ajuste
                      </button>
                      <button 
                          onClick={() => handleSubmitApproval(true)} 
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 shadow-md"
                      >
                          Aprobar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* BITACORA MODAL */}
      {logModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ClipboardList/> Bitácora Actividad</h3>
                      <button onClick={() => setLogModal(null)}><XCircle className="text-slate-400 hover:text-red-500"/></button>
                  </div>
                  {currentLogs.length > 0 ? (
                      <div className="space-y-4">
                          {currentLogs.map(log => (
                              <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-1">
                                  <div className="flex justify-between items-start">
                                      <p className="font-bold text-sm text-slate-800">{log.status}</p>
                                      <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10}/> {new Date(log.date).toLocaleString()}</span>
                                  </div>
                                  <p className="text-sm text-slate-600 mt-1">{log.comment}</p>
                                  <div className="mt-2 text-xs flex gap-4 text-slate-500">
                                      <span><b>Usuario:</b> {log.userName || 'Sistema'}</span>
                                      <span><b>Unid. Ejec:</b> {log.executedUnits}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-center text-slate-400 italic py-6">No hay registros en la bitácora.</p>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};
