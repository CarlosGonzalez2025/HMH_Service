import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { TenantDashboard } from './pages/TenantDashboard';
import { OrderManagement } from './pages/OrderManagement';
import { TeamManagement } from './pages/TeamManagement';
import { ClientManagement } from './pages/ClientManagement';
import { UserRole } from './types';

const PrivateRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const RoleBasedDashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'superAdmin') return <SuperAdminDashboard />;
  return <TenantDashboard />;
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<RoleBasedDashboard />} />
                <Route path="/orders" element={<OrderManagement />} />
                <Route path="/billing" element={<OrderManagement />} /> {/* Reuses component with filter */}
                <Route path="/clients" element={<ClientManagement />} />
                <Route path="/tenants" element={<SuperAdminDashboard />} />
                <Route path="/team" element={<TeamManagement />} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}