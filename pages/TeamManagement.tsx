
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getTenantUsers, registerUserForTenant, getConsultantRates, createConsultantRate, getClients, updateUserProfile } from '../services/dataService';
import { User, UserRole, ConsultantRate, Client } from '../types';
import { Users, Plus, Shield, User as UserIcon, XCircle, Loader2, BarChart, DollarSign, FileText, Phone, MapPin, Briefcase, ChevronDown, ChevronUp, Calendar, Pencil } from 'lucide-react';

export const TeamManagement = () => {
    const { user, tenant } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Create/Edit User Modal
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    // Expandable Rows State
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [expandedRates, setExpandedRates] = useState<ConsultantRate[]>([]);

    // Add Rate Modal
    const [rateModal, setRateModal] = useState<string | null>(null); // Provider ID
    const [rateFormData, setRateFormData] = useState({ clientId: '', unit: '', value: 0 });

    // New/Edit User Form
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'provider' as UserRole,
        password: '',
        // Provider specific fields
        documentType: 'CC',
        documentNumber: '',
        profession: '',
        specialization: '',
        licenseSst: '',
        licenseNumber: '',
        licenseDate: '',
        phone: '',
        department: '',
        city: ''
    });

    const loadTeam = async () => {
        if (user && user.tenantId) {
            setLoading(true);
            const [dataUsers, dataClients] = await Promise.all([
                getTenantUsers(user.tenantId),
                getClients(user)
            ]);
            setUsers(dataUsers);
            setClients(dataClients);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTeam();
    }, [user]);

    const handleExpand = async (userId: string) => {
        if (expandedUser === userId) {
            setExpandedUser(null);
        } else {
            setExpandedUser(userId);
            if (user?.tenantId) {
                const rates = await getConsultantRates(user.tenantId, userId);
                setExpandedRates(rates);
            }
        }
    };

    const handleEditUser = (u: User) => {
        setNewUser({
            name: u.name,
            email: u.email,
            role: u.role,
            password: '', // Password reset not directly handled here for security
            documentType: u.documentType || 'CC',
            documentNumber: u.documentNumber || '',
            profession: u.profession || '',
            specialization: u.specialization || '',
            licenseSst: u.licenseSst || '',
            licenseNumber: u.licenseNumber || '',
            licenseDate: u.licenseDate || '',
            phone: u.phone || '',
            department: u.department || '',
            city: u.city || ''
        });
        setIsEditing(true);
        setEditingUserId(u.id);
        setShowModal(true);
    };

    const openCreateModal = () => {
        setNewUser({ 
            name: '', email: '', role: 'provider', password: '',
            documentType: 'CC', documentNumber: '', profession: '', specialization: '', 
            licenseSst: '', licenseNumber: '', licenseDate: '', phone: '', department: '', city: ''
        });
        setIsEditing(false);
        setEditingUserId(null);
        setShowModal(true);
    }

    const handleSubmitUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant) return;

        setSubmitting(true);
        
        // Collect extended profile data
        const extraProfileData: Partial<User> = {};
        if (newUser.role === 'provider') {
            extraProfileData.documentType = newUser.documentType;
            extraProfileData.documentNumber = newUser.documentNumber;
            extraProfileData.profession = newUser.profession;
            extraProfileData.specialization = newUser.specialization;
            extraProfileData.licenseSst = newUser.licenseSst;
            extraProfileData.licenseNumber = newUser.licenseNumber;
            extraProfileData.licenseDate = newUser.licenseDate;
            extraProfileData.phone = newUser.phone;
            extraProfileData.department = newUser.department;
            extraProfileData.city = newUser.city;
        }

        if (isEditing && editingUserId) {
            // UPDATE MODE
            const success = await updateUserProfile(editingUserId, {
                name: newUser.name,
                role: newUser.role,
                ...extraProfileData
            });

            if (success) {
                showToast("Usuario actualizado exitosamente.", "success");
                setShowModal(false);
                loadTeam();
            } else {
                showToast("Error al actualizar el usuario.", "error");
            }
        } else {
            // CREATE MODE
            const success = await registerUserForTenant({
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                password: newUser.password
            }, tenant.id, extraProfileData);

            if (success) {
                showToast("Usuario creado exitosamente.", "success");
                setShowModal(false);
                openCreateModal(); // Reset
                loadTeam();
            } else {
                showToast("Error al crear el usuario. Verifique si el correo ya existe.", "error");
            }
        }
        
        setSubmitting(false);
    };

    const handleSaveRate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.tenantId || !rateModal) return;
        const success = await createConsultantRate(user.tenantId, {
            providerId: rateModal,
            clientId: rateFormData.clientId,
            unit: rateFormData.unit,
            value: rateFormData.value
        });
        
        if(success) {
            showToast("Tarifa agregada correctamente", "success");
            // Refresh rates in expanded view if applicable
            if (expandedUser === rateModal) {
                const rates = await getConsultantRates(user.tenantId, rateModal);
                setExpandedRates(rates);
            }
            setRateModal(null);
            setRateFormData({ clientId: '', unit: '', value: 0 });
        } else {
            showToast("Error al guardar la tarifa", "error");
        }
    };

    if (!user || !tenant) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Mi Equipo / Consultores</h1>
                    <p className="text-slate-500 text-sm">Gestiona el personal de {tenant.name}</p>
                </div>
                {['admin', 'coordinator'].includes(user.role) && (
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200"
                    >
                        <Plus size={18} /> Nuevo Usuario
                    </button>
                )}
            </div>

            {/* User List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-slate-400"/></div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol / Profesión</th>
                                <th className="px-6 py-4">Datos Contacto</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <React.Fragment key={u.id}>
                                    <tr 
                                        className={`hover:bg-slate-50 transition-colors ${u.role === 'provider' ? 'cursor-pointer' : ''}`} 
                                        onClick={() => u.role === 'provider' && handleExpand(u.id)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                            {u.role === 'provider' && u.documentNumber && (
                                                <div className="text-xs text-slate-400 mt-0.5 font-mono">{u.documentType} {u.documentNumber}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                    u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    u.role === 'coordinator' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    u.role === 'analyst' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                    u.role === 'accountant' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                    {u.role === 'admin' && <Shield size={12}/>}
                                                    {u.role === 'analyst' && <BarChart size={12}/>}
                                                    {u.role === 'accountant' && <DollarSign size={12}/>}
                                                    {u.role.toUpperCase()}
                                                </span>
                                                {u.role === 'provider' && u.profession && (
                                                    <span className="text-xs text-slate-600 font-medium">{u.profession}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {u.phone && <div className="flex items-center gap-1 mb-1"><Phone size={12} className="text-slate-400"/> {u.phone}</div>}
                                            {u.city && <div className="flex items-center gap-1"><MapPin size={12} className="text-slate-400"/> {u.city}, {u.department}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">Activo</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {['admin', 'coordinator'].includes(user.role) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditUser(u); }}
                                                        className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                                                        title="Editar Usuario"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                                {u.role === 'provider' && (
                                                    <button className="text-slate-400 hover:text-blue-600 transition-colors">
                                                        {expandedUser === u.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {/* EXPANDED PROVIDER DETAILS */}
                                    {expandedUser === u.id && u.role === 'provider' && (
                                        <tr className="bg-slate-50 border-b border-slate-200 animate-in fade-in">
                                            <td colSpan={5} className="p-6">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                    
                                                    {/* PROFILE CARD */}
                                                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><FileText size={14}/> Perfil Profesional</h4>
                                                            <button onClick={(e) => { e.stopPropagation(); handleEditUser(u); }} className="text-xs text-blue-600 hover:underline">Editar</button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <p className="text-xs text-slate-400">Profesión</p>
                                                                <p className="font-medium text-slate-700">{u.profession || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-slate-400">Especialización</p>
                                                                <p className="font-medium text-slate-700">{u.specialization || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-slate-400">Licencia SST</p>
                                                                <p className="font-medium text-slate-700">{u.licenseNumber || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-slate-400">F. Expedición</p>
                                                                <p className="font-medium text-slate-700">{u.licenseDate || '-'}</p>
                                                            </div>
                                                            <div className="col-span-2 border-t pt-2 mt-2">
                                                                <p className="text-xs text-slate-400 mb-1">Ubicación</p>
                                                                <p className="font-medium text-slate-700 flex items-center gap-1"><MapPin size={12}/> {u.city}, {u.department}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* RATES CARD */}
                                                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><DollarSign size={14}/> Tarifas Negociadas</h4>
                                                            {['admin', 'coordinator'].includes(user.role) && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setRateModal(u.id); }}
                                                                    className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-bold hover:bg-green-100 flex items-center gap-1 border border-green-200"
                                                                >
                                                                    <Plus size={12}/> Nueva Tarifa
                                                                </button>
                                                            )}
                                                        </div>
                                                        
                                                        {expandedRates.length > 0 ? (
                                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                                {expandedRates.map(rate => {
                                                                    const client = clients.find(c => c.id === rate.clientId);
                                                                    return (
                                                                        <div key={rate.id} className="p-2 border rounded bg-slate-50 text-xs flex justify-between items-center hover:bg-slate-100 transition-colors">
                                                                            <div>
                                                                                <p className="font-bold text-slate-700">{client?.name || 'Cliente Desconocido'}</p>
                                                                                <p className="text-slate-500">NIT: {client?.taxId}</p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="font-bold text-green-600 text-sm">${(rate.value || 0).toLocaleString()}</p>
                                                                                <p className="text-slate-400">/{rate.unit}</p>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-6 bg-slate-50 rounded border border-dashed border-slate-200">
                                                                <p className="text-xs text-slate-400 italic">No tiene tarifas asignadas.</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Create/Edit User */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">
                                {isEditing ? 'Editar Colaborador' : 'Registrar Nuevo Colaborador'}
                            </h3>
                            <button onClick={() => setShowModal(false)}><XCircle className="text-slate-400 hover:text-red-500"/></button>
                        </div>
                        <form onSubmit={handleSubmitUser} className="space-y-4">
                            {/* BASIC INFO */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase border-b pb-1 mb-3">Información de Cuenta</h4>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Rol</label>
                                    <select className="w-full border rounded p-2 bg-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                                        <option value="provider">Prestador / Consultor</option>
                                        <option value="coordinator">Coordinador</option>
                                        <option value="analyst">Analista de Operaciones</option>
                                        <option value="accountant">Contabilidad</option>
                                        <option value="admin">Administrador (Backup)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Completo</label>
                                    <input required type="text" className="w-full border rounded p-2" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Email Corporativo</label>
                                    <input 
                                        required 
                                        type="email" 
                                        className={`w-full border rounded p-2 ${isEditing ? 'bg-slate-100 text-slate-500' : ''}`} 
                                        value={newUser.email} 
                                        onChange={e => setNewUser({...newUser, email: e.target.value})} 
                                        disabled={isEditing}
                                    />
                                </div>
                                {!isEditing && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Contraseña Inicial</label>
                                        <input required type="password" className="w-full border rounded p-2" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Min. 6 caracteres"/>
                                    </div>
                                )}
                            </div>

                            {/* CONSULTANT SPECIFIC FIELDS */}
                            {newUser.role === 'provider' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-slate-200 mt-4">
                                    <div className="col-span-2">
                                        <h4 className="text-xs font-bold text-blue-600 uppercase border-b border-blue-200 pb-1 mb-3 flex items-center gap-2"><FileText size={14}/> Datos del Consultor</h4>
                                    </div>
                                    
                                    {/* Documento */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Tipo Documento</label>
                                        <select className="w-full border rounded p-2 text-sm" value={newUser.documentType} onChange={e => setNewUser({...newUser, documentType: e.target.value})}>
                                            <option value="CC">Cédula Ciudadanía</option>
                                            <option value="CE">Cédula Extranjería</option>
                                            <option value="NIT">NIT</option>
                                            <option value="PAS">Pasaporte</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Número Documento</label>
                                        <input required className="w-full border rounded p-2 text-sm" value={newUser.documentNumber} onChange={e => setNewUser({...newUser, documentNumber: e.target.value})} />
                                    </div>

                                    {/* Profesional */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Profesión</label>
                                        <input required placeholder="Ej: Ing. Industrial" className="w-full border rounded p-2 text-sm" value={newUser.profession} onChange={e => setNewUser({...newUser, profession: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Especialización</label>
                                        <input placeholder="Opcional" className="w-full border rounded p-2 text-sm" value={newUser.specialization} onChange={e => setNewUser({...newUser, specialization: e.target.value})} />
                                    </div>

                                    {/* Licencia */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Licencia SST</label>
                                        <input placeholder="Número Licencia" className="w-full border rounded p-2 text-sm" value={newUser.licenseNumber} onChange={e => setNewUser({...newUser, licenseNumber: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">F. Expedición Licencia</label>
                                        <input type="date" className="w-full border rounded p-2 text-sm" value={newUser.licenseDate} onChange={e => setNewUser({...newUser, licenseDate: e.target.value})} />
                                    </div>

                                    {/* Ubicación y Contacto */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Departamento</label>
                                        <input required className="w-full border rounded p-2 text-sm" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Municipio</label>
                                        <input required className="w-full border rounded p-2 text-sm" value={newUser.city} onChange={e => setNewUser({...newUser, city: e.target.value})} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono Móvil</label>
                                        <input required placeholder="300 123 4567" className="w-full border rounded p-2 text-sm" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 mt-4">
                                {isEditing ? 'Los cambios se reflejarán inmediatamente en el perfil del usuario.' : 'Al crear el usuario, podrá acceder inmediatamente con estas credenciales.'}
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancelar</button>
                                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
                                    {submitting ? 'Guardando...' : (isEditing ? 'Actualizar Usuario' : 'Crear Usuario')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Add Rate Only */}
            {rateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><DollarSign size={20}/> Nueva Tarifa</h3>
                            <button onClick={() => setRateModal(null)}><XCircle className="text-slate-400 hover:text-red-500"/></button>
                        </div>
                        
                        <form onSubmit={handleSaveRate}>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Cliente / NIT</label>
                                    <select required className="w-full border rounded p-2 text-sm bg-white" value={rateFormData.clientId} onChange={e => setRateFormData({...rateFormData, clientId: e.target.value})}>
                                        <option value="">Seleccionar Cliente...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Unidad</label>
                                        <input required placeholder="Ej: Hora" className="w-full border rounded p-2 text-sm" value={rateFormData.unit} onChange={e => setRateFormData({...rateFormData, unit: e.target.value})}/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Valor</label>
                                        <input required type="number" className="w-full border rounded p-2 text-sm" value={rateFormData.value} onChange={e => setRateFormData({...rateFormData, value: Number(e.target.value)})}/>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 mt-4 shadow-md">
                                    Guardar Tarifa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
