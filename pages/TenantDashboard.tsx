import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActivities, getClients } from '../services/dataService';
import { Briefcase, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Client } from '../types';

export const TenantDashboard = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
      if(user) {
          setLoading(true);
          const [acts, clis] = await Promise.all([
              getActivities(user),
              getClients(user)
          ]);
          setActivities(acts);
          setClients(clis);
          setLoading(false);
      }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  const stats = useMemo(() => {
    return {
      total: activities.length,
      pending: activities.filter(a => a.status === 'requested').length,
      progress: activities.filter(a => a.status === 'in_progress').length,
      completed: activities.filter(a => a.status === 'completed' || a.status === 'approved').length
    };
  }, [activities]);

  const pieData = [
    { name: 'Pendientes', value: stats.pending, color: '#f59e0b' },
    { name: 'En Ejecución', value: stats.progress, color: '#3b82f6' },
    { name: 'Terminadas', value: stats.completed, color: '#10b981' },
  ];

  if (!user) return null;
  if (loading) return <div className="p-10 text-center text-slate-500">Cargando datos del Tenant...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={loadData} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <RefreshCw size={14}/> Actualizar Datos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Ordenes Totales</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</h3>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Briefcase size={20}/></div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Solicitadas</p>
                <h3 className="text-3xl font-bold text-amber-500 mt-2">{stats.pending}</h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-500"><AlertCircle size={20}/></div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">En Ejecución</p>
                <h3 className="text-3xl font-bold text-blue-500 mt-2">{stats.progress}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><Clock size={20}/></div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Cerradas</p>
                <h3 className="text-3xl font-bold text-emerald-500 mt-2">{stats.completed}</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500"><CheckCircle size={20}/></div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-80">
          <h3 className="font-semibold text-slate-700 mb-4">Estado de Actividades</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Clients */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm overflow-auto h-80">
          <h3 className="font-semibold text-slate-700 mb-4">Clientes Activos</h3>
          <ul className="space-y-3">
            {clients.map((c, i) => (
              <li key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                <div>
                  <p className="font-medium text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-500">Tax ID: {c.taxId}</p>
                </div>
                <span className="text-xs font-medium text-slate-400">{c.billingTerms}</span>
              </li>
            ))}
            {clients.length === 0 && <p className="text-sm text-slate-400">No hay clientes registrados.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
};
