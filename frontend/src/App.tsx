import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

// Public pages
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Protected pages
import DashboardPage from './pages/DashboardPage';
import SuperAdminPage from './pages/SuperAdminPage';

// Admin pages
import UsersPage from './pages/admin/UsersPage';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import TechniciansPage from './pages/admin/TechniciansPage';
import SettingsPage from './pages/admin/SettingsPage';
import ImportPage from './pages/ImportPage';
import WalkthroughPage from './pages/WalkthroughPage';
import KioskPage from './pages/KioskPage';
import KioskSetupPage from './pages/admin/KioskSetupPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              border: '1px solid #374151',
              borderRadius: '12px',
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes — all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/walkthrough" element={<WalkthroughPage />} />

              {/* Super Admin only */}
              <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                <Route path="/super-admin" element={<SuperAdminPage />} />
              </Route>

              {/* Company Admin + Super Admin */}
              <Route element={<ProtectedRoute allowedRoles={['company_admin', 'super_admin']} />}>
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/departments" element={<DepartmentsPage />} />
                <Route path="/admin/technicians" element={<TechniciansPage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
                <Route path="/admin/import" element={<ImportPage />} />
                <Route path="/admin/kiosk" element={<KioskSetupPage />} />
              </Route>
            </Route>
          </Route>

          {/* Kiosk — standalone, no AppLayout */}
          <Route path="/kiosk/:department_id" element={<KioskPage />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
