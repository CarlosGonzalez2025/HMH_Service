import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getClients, createClient, createSubClient, getSubClients, getTenantUsers } from '../services/dataService';
import { Client, SubClient, User } from '../types';
import { Plus, Building, MapPin, Users, ChevronDown, ChevronUp, Phone, FileText, UserCheck } from 'lucide-react';

export const ClientManagement = () => {
    const { user, tenant } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [tenantUsers, setTenantUsers] = useState<User[]>([]);
    
    // UI State
    const [showModal, setShowModal] = useState(false);
    const [subModal, setSubModal] = useState<string | null>(null); // Client ID for new subclient
    const [expandedClient, setExpandedClient] = useState<string | null>(null);
    const [currentSubclients, setCurrentSubclients] = useState<SubClient[]>([]);

    // Forms
    const [formData, setFormData] = useState({ 
        name: '', 
        taxId: '', 
        phone: '',
        address: '',
        department: '',
        city: '',
        hmhCoordinatorId: '',
        billingTerms: ''
    });
    
    const [subFormData, setSubFormData] = useState({ name: '', contactName: '', contactEmail: '' });

    const load = async () => {
        if(user && user.tenantId) {
            const [dataClients, dataUsers] = await Promise.all([
                getClients(user),
                getTenantUsers(user.tenantId)
            ]);
            setClients(dataClients);
            setTenantUsers(dataUsers);
        }
    }

    useEffect(() => { load() }, [user]);

    const handleExpand = async (clientId: string) => {
        if(expandedClient === clientId) {
            setExpandedClient(null);
        } else {
            setExpandedClient(clientId);
            if(user?.tenantId) {
                const subs = await getSubClients(user.tenantId, clientId);
                setCurrentSubclients(subs);
            }
        }
    }

    const handleSubmitClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user) return;
        await createClient(formData, user);
        setShowModal(false);
        // Reset form
        setFormData({ 
            name: '', taxId: '', phone: '', address: '', 
            department: '', city: '', hmhCoordinatorId: '', billingTerms: '' 
        });
        load();
    }

    const handleSubmitSub = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user?.tenantId || !subModal) return;
        await createSubClient(user.tenantId, subModal, subFormData);
        setSubModal(null);
        setSubFormData({ name: '', contactName: '', contactEmail: '' });
        handleExpand(subModal); // Refresh subs
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestión de Clientes</h1>
                    <p className="text-slate-500 text-sm">Base de datos de Clientes y Subclientes</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm">
                    <Plus size={18}/> Nuevo Cliente
                </button>
            </div>

            <div className="grid gap-4">
                {clients.map(client => {
                    const coordinator = tenantUsers.find(u => u.id === client.hmhCoordinatorId);
                    return (
                        <div key={client.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 cursor-pointer gap-4" onClick={() => handleExpand(client.id)}>
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-blue-600 shadow-sm">
                                        <Building size={24}/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{client.name}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                                            <span className="flex items-center gap-1"><FileText size={12}/> NIT: {client.taxId}</span>
                                            <span className="flex items-center gap-1"><MapPin size={12}/> {client.city}, {client.department}</span>
                                            <span className="flex items-center gap-1"><Phone size={12}/> {client.phone}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Coordinador HMH</p>
                                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200">
                                            <UserCheck size={14} className="text-blue-500"/>
                                            <span className="text-xs font-medium text-slate-700">{coordinator?.name || 'Sin asignar'}</span>
                                        </div>
                                    </div>
                                    {expandedClient === client.id ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                                </div>
                            </div>
                            
                            {expandedClient === client.id && (
                                <div className="p-6 border-t border-slate-100 bg-white animate-in fade-in slide-in-from-top-2">
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Información Corporativa</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between border-b border-slate-200 pb-1">
                                                    <span className="text-slate-500">Dirección:</span>
                                                    <span className="font-medium text-slate-700">{client.address}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-slate-200 pb-1">
                                                    <span className="text-slate-500">Teléfono:</span>
                                                    <span className="font-medium text-slate-700">{client.phone}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-slate-200 pb-1">
                                                    <span className="text-slate-500">Ubicación:</span>
                                                    <span className="font-medium text-slate-700">{client.city}, {client.department}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <h4 className="text-xs font-bold text-blue-500 uppercase mb-3">Condiciones de Facturación</h4>
                                            <p className="text-sm text-blue-800">{client.billingTerms}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Users size={16}/> Subclientes / Sedes</h4>
                                        <button onClick={(e) => { e.stopPropagation(); setSubModal(client.id); }} className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                                            <Plus size={12}/> Agregar Subcliente
                                        </button>
                                    </div>
                                    {currentSubclients.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {currentSubclients.map(sub => (
                                                <div key={sub.id} className="p-3 border rounded bg-slate-50 text-sm hover:bg-slate-100 transition-colors">
                                                    <p className="font-semibold text-slate-800">{sub.name}</p>
                                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                        <UserCheck size={12}/> {sub.contactName} 
                                                        <span className="mx-1">•</span> 
                                                        {sub.contactEmail}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded border border-dashed border-slate-200 text-center">No hay subclientes registrados.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Create Client Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
                        <h3 className="text-lg font-bold mb-6 text-slate-800 border-b pb-2">Registrar Nuevo Cliente</h3>
                        <form onSubmit={handleSubmitClient} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-slate-600 mb-1">NIT / Identificación</label>
                                    <input required placeholder="Ej: 900.000.000-1" className="w-full border p-2 rounded text-sm bg-slate-50" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})}/>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Razón Social</label>
                                    <input required placeholder="Nombre de la empresa" className="w-full border p-2 rounded text-sm bg-slate-50" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono Empresa</label>
                                    <input required placeholder="Fijo o Celular" className="w-full border p-2 rounded text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Dirección Principal</label>
                                    <input required placeholder="Dirección física" className="w-full border p-2 rounded text-sm" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}/>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Departamento</label>
                                    <input required placeholder="Ej: Cundinamarca" className="w-full border p-2 rounded text-sm" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Ciudad Principal</label>
                                    <input required placeholder="Ej: Bogotá" className="w-full border p-2 rounded text-sm" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}/>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Coordinador HMH</label>
                                    <select required className="w-full border p-2 rounded text-sm bg-white" value={formData.hmhCoordinatorId} onChange={e => setFormData({...formData, hmhCoordinatorId: e.target.value})}>
                                        <option value="">Seleccionar Responsable...</option>
                                        {tenantUsers.filter(u => ['admin', 'coordinator'].includes(u.role)).map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Condiciones Facturación</label>
                                    <input required placeholder="Ej: 30 Días, Orden Compra requerida" className="w-full border p-2 rounded text-sm" value={formData.billingTerms} onChange={e => setFormData({...formData, billingTerms: e.target.value})}/>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 shadow-md">Guardar Cliente</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create SubClient Modal */}
            {subModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Nuevo Subcliente</h3>
                        <form onSubmit={handleSubmitSub} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Sede / Subcliente</label>
                                <input required placeholder="Ej: Sede Norte" className="w-full border p-2 rounded text-sm" value={subFormData.name} onChange={e => setSubFormData({...subFormData, name: e.target.value})}/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Contacto</label>
                                <input required placeholder="Persona encargada" className="w-full border p-2 rounded text-sm" value={subFormData.contactName} onChange={e => setSubFormData({...subFormData, contactName: e.target.value})}/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Email Contacto</label>
                                <input required type="email" placeholder="email@sede.com" className="w-full border p-2 rounded text-sm" value={subFormData.contactEmail} onChange={e => setSubFormData({...subFormData, contactEmail: e.target.value})}/>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setSubModal(null)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 shadow-md">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};