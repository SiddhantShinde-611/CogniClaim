import { Bell, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { useState } from 'react';

export function Navbar() {
  const { user } = useAuthStore();
  const { logout, isLoggingOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const roleBadgeVariant = {
    ADMIN: 'danger' as const,
    MANAGER: 'warning' as const,
    EMPLOYEE: 'default' as const,
  }[user?.role || 'EMPLOYEE'];

  return (
    <header className="fixed top-0 right-0 left-0 h-14 bg-white border-b border-gray-200 z-10 flex items-center justify-between px-4 pl-64">
      {/* Page context breadcrumb area */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Welcome back,</span>
        <span className="text-sm font-medium text-text-primary">{user?.email}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Company badge */}
        {user?.company_name && (
          <span className="text-xs text-gray-400 hidden md:block">{user.company_name}</span>
        )}

        {/* Notifications (placeholder) */}
        <button className="relative rounded-lg p-2 text-gray-400 hover:bg-surface hover:text-gray-600 transition-colors">
          <Bell className="h-5 w-5" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary flex items-center justify-center text-xs font-semibold">
              {user ? getInitials(user.email) : <User className="h-4 w-4" />}
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-xs font-medium text-text-primary leading-tight">{user?.email}</span>
              <Badge variant={roleBadgeVariant} className="text-[10px] py-0 px-1.5 h-4">
                {user?.role}
              </Badge>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white border border-gray-200 shadow-lg z-50 py-1">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <p className="text-xs font-medium text-text-primary">{user?.role}</p>
              </div>
              <button
                onClick={() => {
                  setShowMenu(false);
                  logout();
                }}
                disabled={isLoggingOut}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
      )}
    </header>
  );
}
