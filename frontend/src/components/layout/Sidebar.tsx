import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  CheckSquare,
  Settings,
  ClipboardList,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  // Employee
  { label: 'Dashboard', path: '/employee', icon: LayoutDashboard, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { label: 'Submit Expense', path: '/employee/submit', icon: PlusCircle, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { label: 'My Expenses', path: '/employee/expenses', icon: FileText, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
  // Manager
  { label: 'Approval Queue', path: '/manager/approvals', icon: CheckSquare, roles: ['MANAGER', 'ADMIN'] },
  // Admin
  { label: 'Admin Dashboard', path: '/admin', icon: BarChart3, roles: ['ADMIN'] },
  { label: 'All Expenses', path: '/admin/expenses', icon: ClipboardList, roles: ['ADMIN'] },
  { label: 'User Management', path: '/admin/users', icon: Users, roles: ['ADMIN'] },
  { label: 'Approval Rules', path: '/admin/rules', icon: Settings, roles: ['ADMIN'] },
];

export function Sidebar() {
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-20 transition-all duration-200 flex flex-col',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-gray-100', collapsed && 'justify-center')}>
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">CC</span>
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-text-primary text-sm leading-tight">CogniClaim</p>
            <p className="text-xs text-gray-400">Expense Platform</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/employee' || item.path === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary'
                  : 'text-gray-600 hover:bg-surface hover:text-text-primary',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-surface w-full transition-colors',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
