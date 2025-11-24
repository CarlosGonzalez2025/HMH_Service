import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTenantUsers, registerUserForTenant } from '../services/dataService';
import { User, UserRole } from '../types';
import { Users, Plus, Shield, User as UserIcon, XCircle, Loader2, BarChart, DollarSign } from 'lucide-react';

export const TeamManagement = () => {
    const { user, tenant } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'provider' as UserRole,
        password: ''
    });

    const loadTeam = async () => {
        if (user && user.tenantId) {
            setLoading(true);
            const data = await getTenantUsers(user.tenantId);
            setUsers(data);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTeam();
    }, [user]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant) return;

        setSubmitting(true);
        const success = await registerUserForTenant({
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            password: newUser.password
        }, tenant.id);

        if (success) {
            alert("Usuario creado exitosamente.");
            setShowModal(false);
            setNewUser({ name: '', email: '', role: 'provider', password: '' });
            loadTeam();
        }
        setSubmitting(false);
    };

    if (!user || !tenant) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Mi Equipo</h1>
                    <p className="text-slate-500 text-sm">Gestiona el personal de {tenant.name}</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200"
                >
                    <Plus size={18} /> Nuevo Usuario
                </button>
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
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">ID Sistema</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{u.name}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
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
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">Activo</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                        {u.id.substring(0, 8)}...
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Registrar Nuevo Colaborador</h3>
                            <button onClick={() => setShowModal(false)}><XCircle className="text-slate-400 hover:text-red-500"/></button>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Completo</label>
                                <input required type="text" className="w-full border rounded p-2" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Email Corporativo</label>
                                <input required type="email" className="w-full border rounded p-2" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Contraseña Inicial</label>
                                <input required type="password" className="w-full border rounded p-2" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Min. 6 caracteres"/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Rol</label>
                                <select className="w-full border rounded p-2 bg-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                                    <option value="coordinator">Coordinador</option>
                                    <option value="analyst">Analista de Operaciones</option>
                                    <option value="provider">Prestador / Consultor</option>
                                    <option value="accountant">Contabilidad</option>
                                    <option value="admin">Administrador (Backup)</option>
                                </select>
                            </div>

                            <div className="bg-blue-50 p-3 rounded text-xs text-blue-800">
                                Al crear el usuario, podrá acceder inmediatamente con estas credenciales.
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancelar</button>
                                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
                                    {submitting ? 'Creando...' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};