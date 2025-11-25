
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getClients, createClient, createSubClient, getSubClients, getTenantUsers, getClientContacts, createClientContact, getClientPrices, createClientPrice, getSubClientContacts, createSubClientContact } from '../services/dataService';
import { Client, SubClient, User, ClientContact, ClientPrice, SubClientContact } from '../types';
import { Plus, Building, MapPin, Users, ChevronDown, ChevronUp, Phone, FileText, UserCheck, Briefcase, Mail, MessageSquare, DollarSign, Calendar, Eye } from 'lucide-react';

export const ClientManagement = () => {
    const { user, tenant } = useAuth();
    const { showToast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [tenantUsers, setTenantUsers] = useState<User[]>([]);
    
    // UI State
    const [showModal, setShowModal] = useState(false);
    const [subModal, setSubModal] = useState<string | null>(null); // Client ID for new subclient
    const [contactModal, setContactModal] = useState<string | null>(null); // Client ID for new contact
    const [priceModal, setPriceModal] = useState<string | null>(null); // Client ID for new price
    
    const [expandedClient, setExpandedClient] = useState<string | null>(null);
    const [currentSubclients, setCurrentSubclients] = useState<SubClient[]>([]);
    const [currentContacts, setCurrentContacts] = useState<ClientContact[]>([]);
    const [currentPrices, setCurrentPrices] = useState<ClientPrice[]>([]);

    // SubClient UI State
    const [expandedSub, setExpandedSub] = useState<string | null>(null);
    const [currentSubContacts, setCurrentSubContacts] = useState<SubClientContact[]>([]);
    const [subContactModal, setSubContactModal] = useState<string | null>(null); // SubClient ID

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
    
    const [subFormData, setSubFormData] = useState({ 
        nit: '',
        name: '', 
        address: '',
        department: '',
        city: ''
    });
    
    const [contactFormData, setContactFormData] = useState({
        contactType: '',
        name: '',
        position: '',
        email: '',
        phone: '',
        observation: ''
    });

    const [priceFormData, setPriceFormData] = useState({
        unit: '',
        amount: 0,
        validFrom: ''
    });

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
            setExpandedSub(null);
        } else {
            setExpandedClient(clientId);
            setExpandedSub(null);
            if(user?.tenantId) {
                const [subs, conts, prices] = await Promise.all([
                    getSubClients(user.tenantId, clientId),
                    getClientContacts(user.tenantId, clientId),
                    getClientPrices(user.tenantId, clientId)
                ]);
                setCurrentSubclients(subs);
                setCurrentContacts(conts);
                setCurrentPrices(prices);
            }
        }
    }

    const handleExpandSub = async (subId: string) => {
        if(expandedSub === subId) {
            setExpandedSub(null);
        } else {
            setExpandedSub(subId);
            if(user?.tenantId && expandedClient) {
                const contacts = await getSubClientContacts(user.tenantId, expandedClient, subId);
                setCurrentSubContacts(contacts);
            }
        }
    }

    const handleSubmitClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user) return;
        const success = await createClient(formData, user);
        if (success) {
            showToast("Cliente creado exitosamente", "success");
            setShowModal(false);
            // Reset form
            setFormData({ 
                name: '', taxId: '', phone: '', address: '', 
                department: '', city: '', hmhCoordinatorId: '', billingTerms: '' 
            });
            load();
        } else {
            showToast("Error al crear cliente", "error");
        }
    }

    const handleSubmitSub = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user?.tenantId || !subModal) return;
        const success = await createSubClient(user.tenantId, subModal, subFormData);
        if (success) {
            showToast("Subcliente agregado exitosamente", "success");
            setSubModal(null);
            setSubFormData({ nit: '', name: '', address: '', department: '', city: '' });
            handleExpand(subModal); // Refresh
        } else {
            showToast("Error al agregar subcliente", "error");
        }
    }

    const handleSubmitContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user?.tenantId || !contactModal) return;
        const success = await createClientContact(user.tenantId, contactModal, contactFormData);
        if (success) {
            showToast("Contacto guardado exitosamente", "success");
            setContactModal(null);
            setContactFormData({ contactType: '', name: '', position: '', email: '', phone: '', observation: '' });
            handleExpand(contactModal); // Refresh
        } else {
            showToast("Error al guardar contacto", "error");
        }
    }

    const handleSubmitSubContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user?.tenantId || !subContactModal || !expandedClient) return;
        const success = await createSubClientContact(user.tenantId, expandedClient, subContactModal, contactFormData);
        if (success) {
            showToast("Contacto de subcliente guardado", "success");
            const subId = subContactModal;
            setSubContactModal(null);
            setContactFormData({ contactType: '', name: '', position: '', email: '', phone: '', observation: '' });
            
            // Refresh SubContacts
            const contacts = await getSubClientContacts(user.tenantId, expandedClient, subId);
            setCurrentSubContacts(contacts);
        } else {
            showToast("Error al guardar contacto de subcliente", "error");
        }
    }

    const handleSubmitPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user?.tenantId || !priceModal) return;
        const success = await createClientPrice(user.tenantId, priceModal, priceFormData);
        if (success) {
            showToast("Tarifa registrada exitosamente", "success");
            setPriceModal(null);
            setPriceFormData({ unit: '', amount: 0, validFrom: '' });
            handleExpand(priceModal); // Refresh
        } else {
            showToast("Error al registrar tarifa", "error");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestión de Clientes</h1>
                    <p className="text-slate-500 text-sm">Base de datos de Clientes y Subclientes</p>
                </div>
                {['admin', 'coordinator', 'analyst'].includes(user.role) && (
                    <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm">
                        <Plus size={18}/> Nuevo Cliente
                    </button>
                )}
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
                                    
                                    {/* INFO PRINCIPAL */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        
                                        {/* SUBCLIENTES */}
                                        <div className="lg:col-span-1">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Building size={16}/> Subclientes</h4>
                                                {['admin', 'coordinator'].includes(user.role) && (
                                                    <button onClick={(e) => { e.stopPropagation(); setSubModal(client.id); }} className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                                                        <Plus size={12}/> Agregar
                                                    </button>
                                                )}
                                            </div>
                                            {currentSubclients.length > 0 ? (
                                                <div className="space-y-2">
                                                    {currentSubclients.map(sub => (
                                                        <div key={sub.id} className="border rounded bg-slate-50 text-sm overflow-hidden">
                                                            <div className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleExpandSub(sub.id)}>
                                                                <div>
                                                                    <p className="font-semibold text-slate-800">{sub.name}</p>
                                                                    <p className="text-xs text-slate-500">NIT: {sub.nit} - {sub.city}</p>
                                                                </div>
                                                                <ChevronDown size={16} className={`text-slate-400 transform transition-transform ${expandedSub === sub.id ? 'rotate-180' : ''}`}/>
                                                            </div>
                                                            {expandedSub === sub.id && (
                                                                <div className="bg-white border-t p-3 animate-in fade-in">
                                                                    <div className="text-xs text-slate-600 mb-3 space-y-1">
                                                                        <p><span className="font-bold">Dir:</span> {sub.address}</p>
                                                                        <p><span className="font-bold">Depto:</span> {sub.department}</p>
                                                                    </div>
                                                                    <div className="flex justify-between items-center mb-2 border-b pb-1">
                                                                        <span className="text-xs font-bold text-slate-500 uppercase">Contactos Subcliente</span>
                                                                        <button onClick={() => setSubContactModal(sub.id)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"><Plus size={10}/> Nuevo</button>
                                                                    </div>
                                                                    {currentSubContacts.length > 0 ? (
                                                                        <div className="space-y-2">
                                                                            {currentSubContacts.map(sc => (
                                                                                <div key={sc.id} className="p-2 bg-slate-50 rounded border text-xs">
                                                                                    <div className="flex justify-between">
                                                                                        <span className="font-bold">{sc.name}</span>
                                                                                        <span className="text-[10px] bg-slate-200 px-1 rounded">{sc.contactType}</span>
                                                                                    </div>
                                                                                    <p className="text-slate-500">{sc.position}</p>
                                                                                    <div className="mt-1 flex gap-2 text-slate-400">
                                                                                        <span>{sc.email}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-xs text-slate-400 italic">Sin contactos registrados</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded border border-dashed border-slate-200 text-center">No hay subclientes registrados.</p>
                                            )}
                                        </div>

                                        {/* CONTACTOS CLIENTE PRINCIPAL */}
                                        <div className="lg:col-span-1">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Users size={16}/> Contactos Principales</h4>
                                                {['admin', 'coordinator', 'analyst'].includes(user.role) && (
                                                    <button onClick={(e) => { e.stopPropagation(); setContactModal(client.id); }} className="text-xs text-green-600 font-medium hover:underline flex items-center gap-1">
                                                        <Plus size={12}/> Agregar
                                                    </button>
                                                )}
                                            </div>
                                            {currentContacts.length > 0 ? (
                                                <div className="space-y-2">
                                                    {currentContacts.map(contact => (
                                                        <div key={contact.id} className="p-3 border border-slate-200 rounded bg-white text-sm hover:bg-slate-50 transition-colors relative group">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-bold text-slate-800">{contact.name}</p>
                                                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{contact.position}</p>
                                                                </div>
                                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">{contact.contactType}</span>
                                                            </div>
                                                            <div className="mt-2 space-y-1 text-xs text-slate-600">
                                                                <div className="flex items-center gap-2">
                                                                    <Mail size={12}/> {contact.email}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Phone size={12}/> {contact.phone}
                                                                </div>
                                                                {contact.observation && (
                                                                    <div className="flex items-start gap-2 text-slate-400 italic mt-1 pt-1 border-t border-slate-100">
                                                                        <MessageSquare size={12} className="mt-0.5"/> {contact.observation}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded border border-dashed border-slate-200 text-center">No hay contactos registrados.</p>
                                            )}
                                        </div>

                                        {/* TARIFAS / PRECIOS */}
                                        <div className="lg:col-span-1">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><DollarSign size={16}/> Tarifas</h4>
                                                {['admin', 'coordinator'].includes(user.role) && (
                                                    <button onClick={(e) => { e.stopPropagation(); setPriceModal(client.id); }} className="text-xs text-purple-600 font-medium hover:underline flex items-center gap-1">
                                                        <Plus size={12}/> Agregar
                                                    </button>
                                                )}
                                            </div>
                                            {currentPrices.length > 0 ? (
                                                <div className="space-y-2">
                                                    {currentPrices.map(price => (
                                                        <div key={price.id} className="p-3 border rounded bg-purple-50 text-sm hover:bg-purple-100 transition-colors flex justify-between items-center">
                                                            <div>
                                                                <p className="font-bold text-slate-800">{price.unit}</p>
                                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                    <Calendar size={10}/> Desde: {price.validFrom}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="font-bold text-purple-700 text-lg">${price.amount.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded border border-dashed border-slate-200 text-center">No hay tarifas registradas.</p>
                                            )}
                                        </div>

                                    </div>
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
                                <label className="block text-xs font-bold text-slate-600 mb-1">NIT Subcliente</label>
                                <input required placeholder="NIT" className="w-full border p-2 rounded text-sm" value={subFormData.nit} onChange={e => setSubFormData({...subFormData, nit: e.target.value})}/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Sede / Subcliente</label>
                                <input required placeholder="Ej: Sede Norte" className="w-full border p-2 rounded text-sm" value={subFormData.name} onChange={e => setSubFormData({...subFormData, name: e.target.value})}/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Dirección Principal</label>
                                <input required placeholder="Dirección" className="w-full border p-2 rounded text-sm" value={subFormData.address} onChange={e => setSubFormData({...subFormData, address: e.target.value})}/>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Departamento</label>
                                    <input required className="w-full border p-2 rounded text-sm" value={subFormData.department} onChange={e => setSubFormData({...subFormData, department: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Municipio</label>
                                    <input required className="w-full border p-2 rounded text-sm" value={subFormData.city} onChange={e => setSubFormData({...subFormData, city: e.target.value})}/>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setSubModal(null)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 shadow-md">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Contact Modal (Generic for Client or SubClient) */}
            {(contactModal || subContactModal) && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4 text-slate-800">
                            {subContactModal ? 'Nuevo Contacto de Subcliente' : 'Nuevo Contacto de Cliente'}
                        </h3>
                        <form onSubmit={subContactModal ? handleSubmitSubContact : handleSubmitContact} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Completo</label>
                                <input required className="w-full border p-2 rounded text-sm" value={contactFormData.name} onChange={e => setContactFormData({...contactFormData, name: e.target.value})}/>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Cargo</label>
                                    <input required placeholder="Ej: Gerente" className="w-full border p-2 rounded text-sm" value={contactFormData.position} onChange={e => setContactFormData({...contactFormData, position: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Tipo Contacto</label>
                                    <select required className="w-full border p-2 rounded text-sm bg-white" value={contactFormData.contactType} onChange={e => setContactFormData({...contactFormData, contactType: e.target.value})}>
                                        <option value="">Seleccionar...</option>
                                        <option value="Administrativo">Administrativo</option>
                                        <option value="Técnico">Técnico</option>
                                        <option value="Facturación">Facturación</option>
                                        <option value="Comercial">Comercial</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
                                <input required type="email" className="w-full border p-2 rounded text-sm" value={contactFormData.email} onChange={e => setContactFormData({...contactFormData, email: e.target.value})}/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono</label>
                                <input required className="w-full border p-2 rounded text-sm" value={contactFormData.phone} onChange={e => setContactFormData({...contactFormData, phone: e.target.value})}/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Observación</label>
                                <textarea className="w-full border p-2 rounded text-sm h-20" value={contactFormData.observation} onChange={e => setContactFormData({...contactFormData, observation: e.target.value})}></textarea>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => { setContactModal(null); setSubContactModal(null); }} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 shadow-md">Guardar Contacto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Price Modal */}
            {priceModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4 text-slate-800">Nueva Tarifa / Precio</h3>
                        <form onSubmit={handleSubmitPrice} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Unidad</label>
                                <input required placeholder="Ej: Hora Consultoría" className="w-full border p-2 rounded text-sm" value={priceFormData.unit} onChange={e => setPriceFormData({...priceFormData, unit: e.target.value})}/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Valor (COP)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                                    <input required type="number" className="w-full border p-2 pl-6 rounded text-sm" value={priceFormData.amount} onChange={e => setPriceFormData({...priceFormData, amount: Number(e.target.value)})}/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Válido Desde</label>
                                <input required type="date" className="w-full border p-2 rounded text-sm" value={priceFormData.validFrom} onChange={e => setPriceFormData({...priceFormData, validFrom: e.target.value})}/>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setPriceModal(null)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 shadow-md">Guardar Tarifa</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
