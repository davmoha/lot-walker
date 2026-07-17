import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, Plus, Loader2, KeyRound, Trash2 } from 'lucide-react';
import type { Company, User } from '../types';

interface Props {
  company: Company;
  onClose: () => void;
}

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: 'company_admin' | 'employee';
}

const emptyForm: UserForm = { name: '', email: '', password: '', role: 'company_admin' };

export default function ManageUsersModal({ company, onClose }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    try {
      // Super admin fetches users for a specific company by temporarily setting context via query param
      const { data } = await api.get(`/admin/users?company_id=${company.id}`);
      setUsers(data);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [company.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/users', { ...form, company_id: company.id });
      toast.success('User created.');
      setForm(emptyForm);
      setShowAdd(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    try {
      await api.post(`/admin/users/${userId}/reset-password`, { new_password: newPassword });
      toast.success('Password updated.');
      setResetUserId(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to reset password.');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Remove this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User removed.');
      fetchUsers();
    } catch {
      toast.error('Failed to remove user.');
    }
  };

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    company_admin: 'Admin',
    employee: 'Employee',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">Manage Users</h2>
            <p className="text-gray-400 text-sm">{company.name} ({company.dealer_code})</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add user form */}
          {showAdd ? (
            <form onSubmit={handleCreate} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-5 space-y-3">
              <h3 className="text-sm font-semibold text-white mb-2">Add New User</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserForm['role'] })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="company_admin">Admin</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium py-2 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : 'Create User'}
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 mb-5 transition">
              <Plus className="w-4 h-4" /> Add User
            </button>
          )}

          {/* User list */}
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-brand-400 animate-spin" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 py-10 text-sm">No users yet for this company.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-700/40 flex items-center justify-center text-brand-300 text-sm font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{u.name}</p>
                        <p className="text-gray-400 text-xs">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.role === 'company_admin' ? 'bg-brand-900/50 text-brand-300 border border-brand-700/50' :
                        'bg-gray-700/50 text-gray-300 border border-gray-600/50'
                      }`}>
                        {roleLabel[u.role] || u.role}
                      </span>
                      <button onClick={() => { setResetUserId(u.id); setNewPassword(''); }}
                        className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-gray-700 rounded-lg transition" title="Reset password">
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition" title="Remove user">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline password reset */}
                  {resetUserId === u.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password (min 8 chars)"
                        className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <button onClick={() => handleResetPassword(u.id)}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
                        Set
                      </button>
                      <button onClick={() => setResetUserId(null)}
                        className="text-gray-400 hover:text-white text-xs px-2 py-1.5 rounded-lg transition">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
