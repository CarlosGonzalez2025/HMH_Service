
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActivityStates, createActivityState, getActivityTypes, createActivityType } from '../services/dataService';
import { ActivityStateDefinition, ActivityTypeDefinition } from '../types';
import { Loader2, Plus, XCircle, Tag, Clock, User, MessageSquare, List } from 'lucide-react';

export const MastersManagement = () => {
    const { user, tenant } = useAuth();
    const [states, setStates] = useState<ActivityStateDefinition[]>([]);
    const [types, setTypes] = useState<ActivityTypeDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'states' | 'types'>('states');
    
    // Modal State
    const [showStateModal, setShowStateModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);

    // Forms
    const [stateFormData, setStateFormData] = useState({ name: '', description: '', comment: '' });
    const [typeFormData, setTypeFormData] = useState({ name: '' });

    const loadData = async () => {
        if (user && user.tenantId) {
            setLoading(true);
            const [statesData, typesData] = await Promise.all([
                getActivityStates(user.tenantId),
                getActivityTypes(user.tenantId)
            ]);
            setStates(statesData);
            setTypes(typesData);
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [user]);

    const handleSubmitState = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.tenantId) return;
        const success = await createActivityState(user.tenantId, {
            name: stateFormData.name,
            description: stateFormData.description,
            comment: stateFormData.comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: user.id,
            ipUser: '127.0.0.1'
        });
        if (success) {
            setShowStateModal(false);
            setStateFormData({ name: '', description: '', comment: '' });
            loadData();
        }
    };

    const handleSubmitType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.tenantId) return;
        const success = await createActivityType(user.tenantId, {
            name: typeFormData.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: user.id,
            ipUser: '127.0.0.1'
        });
        if (success) {
            setShowTypeModal(false);
            setTypeFormData({ name: '' });
            loadData();
        }
    };

    if (!user || !tenant) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Maestros y Configuración</h1>
                    <p className="text-slate-500 text-sm">Gestión de tablas maestras del sistema</p>
                </div>
                <div>
                    {activeTab === 'states' && (
                        <button onClick={() => setShowStateModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm">
                            <Plus size={18} /> Nuevo Estado
                        </button>
                    )}
                    {activeTab === 'types' && (
                        <button onClick={() => setShowTypeModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm">
                            <Plus size={18} /> Nuevo Tipo
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('states')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'states' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Tag size={16}/> Estados de Actividad
                </button>
                <button 
                    onClick={() => setActiveTab('types')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'types' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <List size={16}/> Tipos de Actividad
                </button>
            </div>

            {loading ? (
                <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-slate-400"/></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* STATES TABLE */}
                    {activeTab === 'states' && (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Nombre Estado</th>
                                    <th className="px-6 py-4">Descripción</th>
                                    <th className="px-6 py-4">Auditoría</th>
                                    <th className="px-6 py-4">Comentarios</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {states.length > 0 ? states.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-bold text-slate-700">{s.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{s.description}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            <div className="flex items-center gap-1"><Clock size={12}/> {s.createdAt.split('T')[0]}</div>
                                            <div className="flex items-center gap-1 mt-1"><User size={12}/> ID: {s.userId.slice(0,6)}...</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 italic">
                                            {s.comment ? <div className="flex items-center gap-1"><MessageSquare size={12}/> {s.comment}</div> : '-'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">No hay estados configurados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* TYPES TABLE */}
                    {activeTab === 'types' && (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Tipo de Actividad</th>
                                    <th className="px-6 py-4">Fecha Creación</th>
                                    <th className="px-6 py-4">Auditoría Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {types.length > 0 ? types.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-xs font-mono text-slate-400">{t.id.slice(0,8)}...</td>
                                        <td className="px-6 py-4 font-bold text-slate-700">{t.name}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            <div className="flex items-center gap-1"><Clock size={12}/> {t.createdAt.split('T')[0]}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            <div className="flex items-center gap-1"><User size={12}/> {t.userId.slice(0,6)}...</div>
                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">IP: {t.ipUser}</div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">No hay tipos de actividad configurados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Create State Modal */}
            {showStateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Tag size={20}/> Nuevo Estado</h3>
                        <form onSubmit={handleSubmitState} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre del Estado</label>
                                <input required className="w-full border rounded p-2 text-sm" value={stateFormData.name} onChange={e => setStateFormData({...stateFormData, name: e.target.value})} placeholder="Ej: En Revisión Técnica" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Descripción</label>
                                <textarea required className="w-full border rounded p-2 text-sm h-20" value={stateFormData.description} onChange={e => setStateFormData({...stateFormData, description: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Comentario (Opcional)</label>
                                <input className="w-full border rounded p-2 text-sm" value={stateFormData.comment} onChange={e => setStateFormData({...stateFormData, comment: e.target.value})} />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowStateModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Type Modal */}
            {showTypeModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><List size={20}/> Nuevo Tipo de Actividad</h3>
                        <form onSubmit={handleSubmitType} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Actividad</label>
                                <input required className="w-full border rounded p-2 text-sm" value={typeFormData.name} onChange={e => setTypeFormData({...typeFormData, name: e.target.value})} placeholder="Ej: Auditoría Interna" />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowTypeModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
