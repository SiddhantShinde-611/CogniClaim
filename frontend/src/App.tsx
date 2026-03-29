import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { LoginPage } from './pages/auth/Login';
import { SignupPage } from './pages/auth/Signup';
import { EmployeeDashboard } from './pages/employee/Dashboard';
import { SubmitExpensePage } from './pages/employee/SubmitExpense';
import { MyExpensesPage } from './pages/employee/MyExpenses';
import { ApprovalQueuePage } from './pages/manager/ApprovalQueuePage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagementPage } from './pages/admin/UserManagement';
import { RuleBuilderPage } from './pages/admin/RuleBuilderPage';
import { AllExpensesPage } from './pages/admin/AllExpenses';
import { useAuthStore } from './stores/authStore';

function ProtectedLayout() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-surface font-sans">
      <Sidebar />
      <div className="ml-60 transition-all duration-200">
        <Navbar />
        <main className="pt-14 p-6 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function RoleGuard({ allowedRoles }: { allowedRoles: string[] }) {
  const { user } = useAuthStore();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/employee" replace />;
  }
  return <Outlet />;
}

function AuthGuard() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/employee" replace />;
  return <Outlet />;
}

export function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthGuard />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedLayout />}>
        {/* Employee Routes (accessible by all roles) */}
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/employee/submit" element={<SubmitExpensePage />} />
        <Route path="/employee/expenses" element={<MyExpensesPage />} />

        {/* Manager Routes */}
        <Route element={<RoleGuard allowedRoles={['MANAGER', 'ADMIN']} />}>
          <Route path="/manager/approvals" element={<ApprovalQueuePage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/expenses" element={<AllExpensesPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/rules" element={<RuleBuilderPage />} />
        </Route>
      </Route>

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
