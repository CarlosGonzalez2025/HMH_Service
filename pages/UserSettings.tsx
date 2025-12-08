
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/Avatar';
import {
  User, Mail, Phone, MapPin, Briefcase, Lock,
  Camera, Save, X, Shield, Building, FileText
} from 'lucide-react';
import { updateUserProfile } from '../services/dataService';
import { auth } from '../firebaseConfig';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export const UserSettings = () => {
  const { user, tenant } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    city: user?.city || '',
    profession: user?.profession || '',
    specialization: user?.specialization || '',
    documentType: user?.documentType || 'CC',
    documentNumber: user?.documentNumber || '',
    photoURL: user?.photoURL || null
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const success = await updateUserProfile(user.id, profileForm);

      if (success) {
        showToast('Perfil actualizado exitosamente', 'success');
        setIsEditing(false);
        // Recargar para obtener datos actualizados
        window.location.reload();
      } else {
        showToast('Error al actualizar perfil', 'error');
      }
    } catch (error) {
      showToast('Error al actualizar perfil', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    if (!auth.currentUser || !auth.currentUser.email) {
      showToast('No se pudo verificar la sesión', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Reautenticar usuario
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        passwordForm.currentPassword
      );

      await reauthenticateWithCredential(auth.currentUser, credential);

      // Cambiar contraseña
      await updatePassword(auth.currentUser, passwordForm.newPassword);

      showToast('Contraseña actualizada exitosamente', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        showToast('Contraseña actual incorrecta', 'error');
      } else {
        showToast('Error al cambiar contraseña', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulación de carga (en producción, subir a Firebase Storage)
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({ ...profileForm, photoURL: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="max-w-5xl mx-auto">
        {/* Header con efecto glassmorphism */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar grande */}
            <div className="relative group">
              <Avatar
                src={profileForm.photoURL}
                name={user.name}
                size="2xl"
                showOnlineIndicator
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white" size={24} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {user.name || 'Usuario'}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
                  {user.role.toUpperCase()}
                </span>
                {tenant && (
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full shadow-lg">
                    {tenant.name}
                  </span>
                )}
              </div>
              <p className="text-slate-600 mt-2 flex items-center gap-2 justify-center sm:justify-start">
                <Mail size={16} />
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <User size={18} />
                Perfil
              </div>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === 'security'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Lock size={18} />
                Seguridad
              </div>
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Información Personal</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    Editar Perfil
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      <User size={16} className="inline mr-2" />
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      <Phone size={16} className="inline mr-2" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                    />
                  </div>

                  {/* Documento */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      <FileText size={16} className="inline mr-2" />
                      Documento
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={profileForm.documentType}
                        onChange={(e) => setProfileForm({ ...profileForm, documentType: e.target.value })}
                        disabled={!isEditing}
                        className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 disabled:bg-slate-50"
                      >
                        <option value="CC">CC</option>
                        <option value="CE">CE</option>
                        <option value="PA">PA</option>
                      </select>
                      <input
                        type="text"
                        value={profileForm.documentNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, documentNumber: e.target.value })}
                        disabled={!isEditing}
                        className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      <MapPin size={16} className="inline mr-2" />
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 disabled:bg-slate-50"
                    />
                  </div>

                  {/* Profesión (solo para providers) */}
                  {user.role === 'provider' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          <Briefcase size={16} className="inline mr-2" />
                          Profesión
                        </label>
                        <input
                          type="text"
                          value={profileForm.profession}
                          onChange={(e) => setProfileForm({ ...profileForm, profession: e.target.value })}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 disabled:bg-slate-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          <Shield size={16} className="inline mr-2" />
                          Especialización
                        </label>
                        <input
                          type="text"
                          value={profileForm.specialization}
                          onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 disabled:bg-slate-50"
                        />
                      </div>
                    </>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all flex items-center gap-2"
                    >
                      <X size={18} />
                      Cancelar
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Cambiar Contraseña</h2>

              <form onSubmit={handleChangePassword} className="max-w-md">
                <div className="space-y-4">
                  {/* Contraseña actual */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Contraseña Actual
                    </label>
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>

                  {/* Nueva contraseña */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>

                  {/* Confirmar contraseña */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Lock size={18} />
                  {isSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
