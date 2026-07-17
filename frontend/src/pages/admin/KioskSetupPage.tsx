import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Tablet, Copy, ExternalLink, Loader2, ChevronDown } from 'lucide-react';
import type { Department } from '../../types';

export default function KioskSetupPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ kiosk_token: string; kiosk_url: string; department: { name: string } } | null>(null);

  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data)).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!selectedDept) { toast.error('Select a department first.'); return; }
    setGenerating(true);
    try {
      const { data } = await api.post('/kiosk/token', { department_id: selectedDept });
      setResult(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to generate token.');
    } finally {
      setGenerating(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const kioskFullUrl = result
    ? `${window.location.origin}${result.kiosk_url}`
    : '';

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Kiosk Setup</h1>
        <p className="text-gray-400 text-sm mt-0.5">Generate a persistent kiosk URL for a department's shared tablet.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Department</label>
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setResult(null); }}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition appearance-none"
            >
              <option value="">— Select Department —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !selectedDept}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm"
        >
          {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Tablet className="w-4 h-4" />Generate Kiosk Token</>}
        </button>

        {result && (
          <div className="space-y-4 pt-2 border-t border-gray-800">
            <p className="text-green-400 text-sm font-medium">
              ✓ Kiosk token generated for <strong>{result.department.name}</strong>
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Kiosk URL (open on tablet)</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-800 border border-gray-700 text-brand-300 text-xs px-3 py-2 rounded-lg font-mono overflow-x-auto">
                  {kioskFullUrl}
                </code>
                <button onClick={() => copy(kioskFullUrl)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition flex-shrink-0">
                  <Copy className="w-4 h-4" />
                </button>
                <a href={result.kiosk_url} target="_blank" rel="noreferrer"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition flex-shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Kiosk Token (store in tablet browser localStorage)</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-800 border border-gray-700 text-gray-400 text-xs px-3 py-2 rounded-lg font-mono overflow-x-auto break-all">
                  {result.kiosk_token}
                </code>
                <button onClick={() => copy(result.kiosk_token)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition flex-shrink-0">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-600 text-xs mt-1">
                On the tablet: open DevTools → Application → localStorage → add key <code>lw_kiosk_token</code> with this value.
              </p>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-3 text-blue-300 text-xs">
              <strong>Fully Kiosk Browser setup:</strong> Set the Start URL to the Kiosk URL above. Enable "Kiosk Mode" and "Keep Screen On". The token is valid for 1 year.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
