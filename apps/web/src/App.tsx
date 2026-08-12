import { Toaster } from "@/components/ui/toaster";
import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useAppSelector } from "@/store";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import InspectionDetailPage from "@/pages/InspectionDetailPage";
import InspectionsPage from "@/pages/InspectionsPage";
import ProfilePage from "@/pages/ProfilePage";
import ManageUsersPage from "@/pages/admin/ManageUsersPage";

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* ── Public ───────────────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Protected (auth gate → shared layout) ────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/log" element={<Navigate to="/dashboard" replace />} />
            <Route path="/inspections" element={<InspectionsPage />} />
            <Route path="/inspections/:id" element={<InspectionDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <ManageUsersPage />
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>

      {/* Single Toaster instance covers all routes */}
      <Toaster />
    </>
  );
}
