import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MyFilesPage } from './pages/MyFilesPage';
import { RecentPage } from './pages/RecentPage';
import { StarredPage } from './pages/StarredPage';
import { TrashPage } from './pages/TrashPage';
import { StorageAnalyticsPage } from './pages/StorageAnalyticsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { PublicSharePage } from './pages/PublicSharePage';
import { SettingsPage } from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vault-bg dark:bg-vault-darkBg">
        <Loader2 className="w-8 h-8 text-vault-yellow animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vault-bg dark:bg-vault-darkBg">
        <Loader2 className="w-8 h-8 text-vault-yellow animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/files" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Marketing & Auth routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/share/:token" element={<PublicSharePage />} />

        {/* Authenticated Application routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/files" element={<MyFilesPage />} />
          <Route path="/recent" element={<RecentPage />} />
          <Route path="/starred" element={<StarredPage />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/storage" element={<StorageAnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/files" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
