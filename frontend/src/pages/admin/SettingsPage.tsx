import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Loader2, Building2, Save } from 'lucide-react';

interface SettingsForm {
  name: string;
  logo_url: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
}

export default function SettingsPage() {
  const { company } = useAuth();
  const [form, setForm] = useState<SettingsForm>({
    name: '',
    logo_url: '',
    contact_phone: '',
    contact_email: '',
    contact_address: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        logo_url: company.logo_url || '',
        contact_phone: company.contact_info?.phone || '',
        contact_email: company.contact_info?.email || '',
        contact_address: company.contact_info?.address || '',
      });
      setLoading(false);
    }
  }, [company]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    try {
      await api.put(`/admin/companies/${company.id}`, {
        name: form.name,
        logo_url: form.logo_url || undefined,
        contact_info: {
          phone: form.contact_phone,
          email: form.contact_email,
          address: form.contact_address,
        },
      });
      toast.success('Settings saved. Refresh to see logo changes in the header.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Company Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Update your dealership's profile and branding.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-400" /> Branding
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Business Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Logo URL</label>
              <input type="url" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://your-cdn.com/logo.png"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition placeholder-gray-500" />
              <p className="text-gray-500 text-xs mt-1">Paste a direct link to your logo image. Recommended: 200×60px PNG with transparent background.</p>
            </div>
            {form.logo_url && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 inline-block">
                <img src={form.logo_url} alt="Logo preview" className="h-10 w-auto object-contain" />
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone</label>
                <input type="tel" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Address</label>
              <input type="text" value={form.contact_address} onChange={(e) => setForm({ ...form, contact_address: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" />
            </div>
          </div>
        </div>

        {/* Dealer Code (read-only) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">System Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Dealer Code</label>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm bg-gray-800 border border-gray-700 text-gray-300 px-3 py-2 rounded-lg">
                {company?.dealer_code}
              </span>
              <span className="text-gray-500 text-xs">This code is used by staff to log in. Contact support to change it.</span>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Settings</>}
        </button>
      </form>
    </div>
  );
}
