import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Building2, Loader2, X, Users, Pencil } from 'lucide-react';
import type { Company } from '../types';
import ManageUsersModal from '../components/ManageUsersModal';

interface CompanyFormData {
  name: string;
  dealer_code: string;
  logo_url: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
}

const emptyForm: CompanyFormData = {
  name: '',
  dealer_code: '',
  logo_url: '',
  contact_phone: '',
  contact_email: '',
  contact_address: '',
};

export default function SuperAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [manageUsersCompany, setManageUsersCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get('/admin/companies');
      setCompanies(data);
    } catch {
      toast.error('Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditCompany(null);
    setShowCreate(true);
  };

  const openEdit = (c: Company) => {
    setForm({
      name: c.name,
      dealer_code: c.dealer_code,
      logo_url: c.logo_url || '',
      contact_phone: c.contact_info?.phone || '',
      contact_email: c.contact_info?.email || '',
      contact_address: c.contact_info?.address || '',
    });
    setEditCompany(c);
    setShowCreate(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      dealer_code: form.dealer_code.toUpperCase(),
      logo_url: form.logo_url || undefined,
      contact_info: {
        phone: form.contact_phone,
        email: form.contact_email,
        address: form.contact_address,
      },
    };
    try {
      if (editCompany) {
        await api.put(`/admin/companies/${editCompany.id}`, payload);
        toast.success('Company updated.');
      } else {
        await api.post('/admin/companies', payload);
        toast.success('Company created.');
      }
      setShowCreate(false);
      fetchCompanies();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage all dealerships on the platform.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2.5 rounded-lg transition text-sm"
        >
          <Plus className="w-4 h-4" />
          New Company
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Total Companies</p>
          <p className="text-3xl font-bold text-white mt-1">{companies.length}</p>
        </div>
      </div>

      {/* Company list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No companies yet.</p>
          <p className="text-sm mt-1">Click "New Company" to add the first dealership.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Company</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Dealer Code</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Contact</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.name} className="w-8 h-8 rounded object-contain bg-white p-0.5" />
                      ) : (
                        <div className="w-8 h-8 bg-brand-700/40 rounded flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-brand-400" />
                        </div>
                      )}
                      <span className="text-white font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2 py-1 rounded">
                      {c.dealer_code}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-400">
                    {c.contact_info?.email || c.contact_info?.phone || '—'}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setManageUsersCompany(c)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg transition"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Users
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Company Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                {editCompany ? 'Edit Company' : 'Create New Company'}
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Business Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Dealer Code *</label>
                  <input
                    type="text"
                    value={form.dealer_code}
                    onChange={(e) => setForm({ ...form, dealer_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. DEALER01"
                    disabled={!!editCompany}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition disabled:opacity-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Logo URL</label>
                  <input
                    type="url"
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    placeholder="https://…"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Contact Phone</label>
                  <input
                    type="tel"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Address</label>
                  <input
                    type="text"
                    value={form.contact_address}
                    onChange={(e) => setForm({ ...form, contact_address: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium py-2.5 rounded-lg transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : (editCompany ? 'Save Changes' : 'Create Company')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Users Modal */}
      {manageUsersCompany && (
        <ManageUsersModal
          company={manageUsersCompany}
          onClose={() => setManageUsersCompany(null)}
        />
      )}
    </div>
  );
}
