import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import { userApi } from '../../lib/api';
import { User } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../stores/authStore';
import { UserPlus, Users, Edit2 } from 'lucide-react';
import { formatDate, getInitials } from '../../lib/utils';

export function UserManagementPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'EMPLOYEE',
    manager_id: '',
    is_manager_approver: false,
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await userApi.getAll();
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => userApi.create({
      email: form.email,
      password: form.password,
      role: form.role,
      manager_id: form.manager_id || undefined,
      is_manager_approver: form.is_manager_approver,
    }),
    onSuccess: () => {
      toast('User created successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setForm({ email: '', password: '', role: 'EMPLOYEE', manager_id: '', is_manager_approver: false });
    },
    onError: (err: any) => {
      toast(err?.response?.data?.error || 'Failed to create user', 'error');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => userApi.updateRole(id, role),
    onSuccess: () => {
      toast('Role updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
    },
    onError: () => toast('Failed to update role', 'error'),
  });

  const assignManagerMutation = useMutation({
    mutationFn: ({ id, manager_id, is_manager_approver }: { id: string; manager_id?: string; is_manager_approver?: boolean }) =>
      userApi.assignManager(id, { manager_id, is_manager_approver }),
    onSuccess: () => {
      toast('Manager assigned', 'success');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
    },
    onError: () => toast('Failed to assign manager', 'error'),
  });

  const [editForm, setEditForm] = useState({ role: '', manager_id: '', is_manager_approver: false });

  const openEdit = (u: User) => {
    setEditUser(u);
    setEditForm({ role: u.role, manager_id: u.manager_id || '', is_manager_approver: u.is_manager_approver || false });
  };

  const handleEditSave = () => {
    if (!editUser) return;
    if (editForm.role !== editUser.role) {
      updateRoleMutation.mutate({ id: editUser.id, role: editForm.role });
    }
    if (editForm.manager_id !== (editUser.manager_id || '') || editForm.is_manager_approver !== editUser.is_manager_approver) {
      assignManagerMutation.mutate({
        id: editUser.id,
        manager_id: editForm.manager_id || undefined,
        is_manager_approver: editForm.is_manager_approver,
      });
    }
  };

  const roleBadgeVariant = (role: string) =>
    ({ ADMIN: 'danger' as const, MANAGER: 'warning' as const, EMPLOYEE: 'default' as const }[role] || 'default' as const);

  const managerOptions = [
    { value: '', label: 'No Manager' },
    ...users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN').map((u) => ({ value: u.id, label: u.email })),
  ];

  const roleOptions = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'EMPLOYEE', label: 'Employee' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
          <p className="text-gray-500 text-sm">{users.length} users in your organization</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Manager Approver</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary flex items-center justify-center text-xs font-semibold">
                          {getInitials(u.email)}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{u.email}</p>
                          {u.id === currentUser?.id && (
                            <span className="text-xs text-gray-400">(you)</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(u.role)}>{u.role}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs">
                      {u.manager?.email || '—'}
                    </TableCell>
                    <TableCell>
                      {u.is_manager_approver ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {u.created_at ? formatDate(u.created_at) : '—'}
                    </TableCell>
                    <TableCell>
                      {u.id !== currentUser?.id && (
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(u)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Add New User" size="md">
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="employee@company.com"
          />
          <Input
            label="Temporary Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Minimum 8 characters"
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={roleOptions}
          />
          <Select
            label="Manager (optional)"
            value={form.manager_id}
            onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
            options={managerOptions}
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_manager_approver"
              checked={form.is_manager_approver}
              onChange={(e) => setForm({ ...form, is_manager_approver: e.target.checked })}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="is_manager_approver" className="text-sm text-text-primary">
              Manager is always first approver for this user
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
            >
              Create User
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)} title="Edit User" size="md">
        {editUser && (
          <div className="space-y-4">
            <div className="bg-surface rounded-lg p-3">
              <p className="text-sm font-medium text-text-primary">{editUser.email}</p>
              <p className="text-xs text-gray-400">Editing user settings</p>
            </div>
            <Select
              label="Role"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              options={roleOptions}
            />
            <Select
              label="Manager"
              value={editForm.manager_id}
              onChange={(e) => setEditForm({ ...editForm, manager_id: e.target.value })}
              options={managerOptions}
            />
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="edit_manager_approver"
                checked={editForm.is_manager_approver}
                onChange={(e) => setEditForm({ ...editForm, is_manager_approver: e.target.checked })}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary-500"
              />
              <label htmlFor="edit_manager_approver" className="text-sm text-text-primary">
                Manager is always first approver
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={handleEditSave}
                loading={updateRoleMutation.isPending || assignManagerMutation.isPending}
              >
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
