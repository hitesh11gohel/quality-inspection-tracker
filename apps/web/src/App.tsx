import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

import AppLayout        from '@/components/layout/AppLayout';
import ProtectedRoute   from '@/components/layout/ProtectedRoute';

import LoginPage            from '@/pages/auth/LoginPage';
import RegisterPage         from '@/pages/auth/RegisterPage';
import DashboardPage        from '@/pages/DashboardPage';
import LogInspectionPage    from '@/pages/LogInspectionPage';
import InspectionsPage      from '@/pages/InspectionsPage';
import InspectionDetailPage from '@/pages/InspectionDetailPage';
import ProfilePage          from '@/pages/ProfilePage';

export default function App() {
  return (
    <>
      <Routes>
        {/* ── Public ───────────────────────────────────────── */}
        <Route path="/login"    element={<LoginPage />}    />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Protected (auth gate → shared layout) ────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index                  element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"      element={<DashboardPage />}        />
            <Route path="/log"            element={<LogInspectionPage />}    />
            <Route path="/inspections"    element={<InspectionsPage />}      />
            <Route path="/inspections/:id" element={<InspectionDetailPage />} />
            <Route path="/profile"        element={<ProfilePage />}          />
            <Route path="*"              element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>

      {/* Single Toaster instance covers all routes */}
      <Toaster />
    </>
  );
}
