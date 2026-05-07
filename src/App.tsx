import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { AdminDashboard } from './pages/admin/Dashboard';
import { VendorDashboard } from './pages/vendor/Dashboard';
import { MechanicDashboard } from './pages/mechanic/Dashboard';
import { CustomerHome } from './pages/customer/Home';
import { CustomerProfile } from './pages/customer/Profile';
import { VendorServices } from './pages/customer/VendorServices';
import { About } from './pages/About';
import { Support } from './pages/Support';
import { TopNav } from './components/TopNav';

function ProtectedRoute({ roles, children }: { roles: string[], children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles.length > 0 && !roles.includes(user.role)) return <Navigate to="/login" />; // basic unauthorized

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans flex flex-col">
          <TopNav />
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Common Authenticated Routes */}
            <Route path="/about" element={
              <ProtectedRoute roles={[]}>
                <About />
              </ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute roles={[]}>
                <Support />
              </ProtectedRoute>
            } />

            {/* Customer Routes */}
            <Route path="/home" element={
              <ProtectedRoute roles={['customer']}>
                <CustomerHome />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute roles={['customer']}>
                <CustomerProfile />
              </ProtectedRoute>
            } />
            <Route path="/vendor/:id" element={
              <ProtectedRoute roles={['customer']}>
                <VendorServices />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Vendor Routes */}
            <Route path="/vendor" element={
              <ProtectedRoute roles={['vendor']}>
                <VendorDashboard />
              </ProtectedRoute>
            } />

            {/* Mechanic Routes */}
            <Route path="/mechanic" element={
              <ProtectedRoute roles={['mechanic']}>
                <MechanicDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
