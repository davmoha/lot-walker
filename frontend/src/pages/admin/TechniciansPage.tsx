import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Loader2, X, Pencil, Trash2, Wrench, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Technician, Department } from '../../types';

interface TechForm {
  name: string;
  department_id: string;
  active: boolean;
}

const emptyForm: TechForm = { name: '', department_id: '', active: true };

export default function TechniciansPage() {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTech, setEditTech] = useState<Technician | null>(null);
  const [form, setForm] = useState<TechForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterDept, setFilterDept] = useState('');

  const fetchData = async () => {
    try {
      const [techRes, deptRes] = await Promise.all([
        api.get('/technicians'),
        api.get('/departments'),
      ]);
      setTechs(techRes.data);
      setDepartments(deptRes.data);
    } catch {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditTech(null);
    setShowModal(true);
  };

  const openEdit = (t: Technician) => {
    setForm({ name: t.name, department_id: t.department_id || '', active: t.active });
    setEditTech(t);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      department_id: form.department_id || null,
      active: form.active,
    };
    try {
      if (editTech) {
        await api.put(`/technicians/${editTech.id}`, payload);
        toast.success('Technician updated.');
      } else {
        await api.post('/technicians', payload);
        toast.success('Technician added.');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (t: Technician) => {
    try {
      await api.put(`/technicians/${t.id}`, { active: !t.active });
      toast.success(t.active ? 'Technician deactivated.' : 'Technician activated.');
      fetchData();
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async (t: Technician) => {
    if (!confirm(`Remove ${t.name}?`)) return;
    try {
      await api.delete(`/technicians/${t.id}`);
      toast.success('Technician removed.');
      fetchData();
    } catch {
      toast.error('Failed to remove technician.');
    }
  };

  const filtered = filterDept
    ? techs.filter((t) => t.department_id === filterDept)
    : techs;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Technicians</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage shop technicians and their department assignments.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2.5 rounded-lg transition text-sm">
          <Plus className="w-4 h-4" /> Add Technician
        </button>
      </div>

      {/* Department filter */}
      <div className="mb-4 flex items-center gap-3">
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <span className="text-gray-500 text-sm">{filtered.length} technician{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No technicians found.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Name</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Department</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-sm font-bold flex-shrink-0">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`font-medium ${t.active ? 'text-white' : 'text-gray-500 line-through'}`}>{t.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {t.department_name ? (
                      <span className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2 py-1 rounded-full">
                        {t.department_name}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleToggleActive(t)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition ${
                        t.active
                          ? 'bg-green-900/30 text-green-400 border-green-700/40 hover:bg-green-900/50'
                          : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700'
                      }`}>
                      {t.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {t.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(t)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(t)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">{editTech ? 'Edit Technician' : 'Add Technician'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Department</label>
                <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition">
                  <option value="">— Unassigned —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-brand-600 focus:ring-brand-500" />
                <label htmlFor="active" className="text-sm font-medium text-gray-300">Active (visible in kiosk dropdowns)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium py-2.5 rounded-lg transition text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : (editTech ? 'Save Changes' : 'Add Technician')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
