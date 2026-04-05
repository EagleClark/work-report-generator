import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import { LoginPage } from './pages/LoginPage.page';
import { HomePage } from './pages/Home.page';
import { WeeklyReportPage } from './pages/WeeklyReport.page';
import { UserManagementPage } from './pages/UserManagement.page';
import { ProjectManagementPage } from './pages/ProjectManagement.page';
import { UserRole } from './types/user';

export function Router() {
  return (
    <Routes>
      {/* 登录页：公开 */}
      <Route path="/login" element={<LoginPage />} />

      {/* 周报汇总：游客可访问 */}
      <Route path="/weekly-report" element={<WeeklyReportPage />} />

      {/* 任务管理：需要登录，普通用户及以上 */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={[UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            <HomePage />
          </ProtectedRoute>
        }
      />

      {/* 项目管理：仅管理员和超管可访问 */}
      <Route
        path="/projects"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            <ProjectManagementPage />
          </ProtectedRoute>
        }
      />

      {/* 用户管理：仅管理员和超管可访问 */}
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            <UserManagementPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}