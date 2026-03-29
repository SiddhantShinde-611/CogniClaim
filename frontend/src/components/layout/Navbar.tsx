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
    <header className="fixed top-0 right-0 left-0 h-14 z-10 flex items-center justify-between px-4 pl-64"
      style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E7E5E4', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-center gap-2">
        <span style={{ fontSize: '13px', color: '#A8A29E' }}>Welcome back,</span>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1C1917' }}>{user?.email}</span>
      </div>

      <div className="flex items-center gap-3">
        {user?.company_name && (
          <span className="hidden md:block" style={{ fontSize: '12px', color: '#A8A29E' }}>{user.company_name}</span>
        )}

        <button
          className="relative flex items-center justify-center transition-colors"
          style={{ width: '34px', height: '34px', borderRadius: '6px', color: '#A8A29E', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F5F5F4'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
        >
          <Bell style={{ width: '16px', height: '16px' }} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 transition-colors"
            style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F5F5F4'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
          >
            <div
              className="flex items-center justify-center"
              style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#111116', color: '#FAFAF9', fontSize: '11px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}
            >
              {user ? getInitials(user.email) : <User style={{ width: '14px', height: '14px' }} />}
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#1C1917', lineHeight: 1.3 }}>{user?.email}</span>
              <Badge variant={roleBadgeVariant} className="text-[10px] py-0 px-1.5 h-4">
                {user?.role}
              </Badge>
            </div>
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-48 py-1 z-50"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E5E4', borderRadius: '6px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #E7E5E4' }}>
                <p style={{ fontSize: '11px', color: '#A8A29E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                <p style={{ fontSize: '11px', fontWeight: 500, color: '#1C1917' }}>{user?.role}</p>
              </div>
              <button
                onClick={() => { setShowMenu(false); logout(); }}
                disabled={isLoggingOut}
                className="flex items-center gap-2 w-full transition-colors"
                style={{ padding: '8px 12px', fontSize: '13px', color: '#B91C1C', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FEF2F2'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
              >
                <LogOut style={{ width: '14px', height: '14px' }} />
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
