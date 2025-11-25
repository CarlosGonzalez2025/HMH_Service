import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Lock } from 'lucide-react';

export const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
        alert("Por favor ingrese email y contraseña");
        return;
    }
    await login(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        {/* Login Form */}
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col justify-center">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mx-auto mb-4">
              <img
                src="/logo.png"
                alt="HMH Logo"
                className="h-20 w-auto object-contain"
                onError={(e) => {
                  // Fallback to icon if image not found
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-16 h-16 bg-blue-600 rounded-xl items-center justify-center shadow-lg shadow-blue-200 hidden">
                <ShieldCheck className="text-white w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">SaaS HMH Enterprise</h1>
            <p className="text-slate-500 mt-2">Plataforma de Gestión de Consultoría H&S</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Corporativo</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="nombre@empresa.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button 
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-md shadow-blue-200"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};