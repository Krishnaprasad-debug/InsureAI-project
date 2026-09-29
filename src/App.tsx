import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { type ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppLayout } from './components/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { ClaimFormPage } from './pages/ClaimFormPage';
import { PredictionResultPage } from './pages/PredictionResultPage';
import { ClaimHistoryPage, ClaimDetailPage } from './pages/ClaimHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminClaimsPage, AdminClaimReviewPage } from './pages/AdminClaimsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { NotificationsPage } from './pages/NotificationsPage';

import { CompanyDashboardPage } from './pages/company/CompanyDashboardPage';
import { CompanyClaimsPage } from './pages/company/CompanyClaimsPage';
import { CompanyClaimDetailPage } from './pages/company/CompanyClaimDetailPage';
import { CompanyPendingPage } from './pages/company/CompanyPendingPage';
import { CompanyPredictionsPage } from './pages/company/CompanyPredictionsPage';
import { CompanyAnalyticsPage } from './pages/company/CompanyAnalyticsPage';
import { CompanyProfilePage } from './pages/company/CompanyProfilePage';

function ProtectedRoute({ children, admin, company }: { children: ReactNode; admin?: boolean; company?: boolean }) {
  const { session, loading, isAdmin, isCompany } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (admin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (company && !isCompany) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/company/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Customer routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/claims/new" element={<ClaimFormPage />} />
        <Route path="/claims" element={<ClaimHistoryPage />} />
        <Route path="/claims/:id" element={<ClaimDetailPage />} />
        <Route path="/claims/:id/result" element={<PredictionResultPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Company Officer routes */}
      <Route element={<ProtectedRoute company><AppLayout company /></ProtectedRoute>}>
        <Route path="/company/dashboard" element={<CompanyDashboardPage />} />
        <Route path="/company/claims" element={<CompanyClaimsPage />} />
        <Route path="/company/claims/:id" element={<CompanyClaimDetailPage />} />
        <Route path="/company/pending" element={<CompanyPendingPage />} />
        <Route path="/company/predictions" element={<CompanyPredictionsPage />} />
        <Route path="/company/analytics" element={<CompanyAnalyticsPage />} />
        <Route path="/company/profile" element={<CompanyProfilePage />} />
        <Route path="/company/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute admin><AppLayout admin /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/claims" element={<AdminClaimsPage />} />
        <Route path="/admin/claims/:id" element={<AdminClaimReviewPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
