import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Loader2, X, Pencil, Trash2, Mail } from 'lucide-react';
import type { Department } from '../../types';

interface DeptForm {
  name: string;
  notification_email: string;
}

const emptyForm: DeptForm = { name: '', notification_email: '' };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [form, setForm] = useState<DeptForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchDepts = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data);
    } catch {
      toast.error('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepts(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditDept(null);
    setShowModal(true);
  };

  const openEdit = (d: Department) => {
    setForm({ name: d.name, notification_email: d.notification_email || '' });
    setEditDept(d);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editDept) {
        await api.put(`/departments/${editDept.id}`, form);
        toast.success('Department updated.');
      } else {
        await api.post('/departments', form);
        toast.success('Department created.');
      }
      setShowModal(false);
      fetchDepts();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d: Department) => {
    if (!confirm(`Delete "${d.name}"? Issues assigned to this department will be unassigned.`)) return;
    try {
      await api.delete(`/departments/${d.id}`);
      toast.success('Department deleted.');
      fetchDepts();
    } catch {
      toast.error('Failed to delete department.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Departments</h1>
          <p className="text-gray-400 text-sm mt-0.5">Configure shop departments and their notification emails.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2.5 rounded-lg transition text-sm">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
      ) : departments.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="font-medium">No departments yet.</p>
          <p className="text-sm mt-1">Add departments like "Service", "Body Shop", "Detail", etc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold">{d.name}</h3>
                  {d.notification_email ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-gray-400 text-xs">{d.notification_email}</span>
                    </div>
                  ) : (
                    <span className="text-gray-600 text-xs mt-1 block">No notification email</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(d)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(d)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">{editDept ? 'Edit Department' : 'Add Department'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Department Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Service, Body Shop, Detail"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition placeholder-gray-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Notification Email</label>
                <input type="email" value={form.notification_email} onChange={(e) => setForm({ ...form, notification_email: e.target.value })}
                  placeholder="service@dealership.com"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition placeholder-gray-500" />
                <p className="text-gray-500 text-xs mt-1">This email receives alerts when new issues are routed to this department.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium py-2.5 rounded-lg transition text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : (editDept ? 'Save Changes' : 'Create Department')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
