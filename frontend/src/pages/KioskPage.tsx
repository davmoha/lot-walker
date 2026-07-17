import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Loader2, X, Clock, Car, ChevronDown, RefreshCw } from 'lucide-react';

interface KioskIssue {
  id: string;
  description: string;
  status: string;
  opened_at: string;
  vin: string;
  stock_number?: string;
  make?: string;
  model?: string;
  trim?: string;
  color?: string;
  department_name?: string;
}

interface Technician {
  id: string;
  name: string;
}

const POLL_INTERVAL = 30_000; // 30 seconds

export default function KioskPage() {
  const { department_id } = useParams<{ department_id: string }>();
  const token = localStorage.getItem('lw_kiosk_token') || localStorage.getItem('lw_token') || '';

  const [issues, setIssues] = useState<KioskIssue[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KioskIssue | null>(null);
  const [techId, setTechId] = useState('');
  const [closing, setClosing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const apiBase = (import.meta as any).env?.VITE_API_URL || '/api';

  const headers = { Authorization: `Bearer ${token}` };

  const fetchIssues = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${apiBase}/kiosk/issues?department_id=${department_id}`,
        { headers }
      );
      setIssues(data);
      setLastRefresh(new Date());
      setCountdown(30);
    } catch (err) {
      console.error('Failed to fetch kiosk issues:', err);
    } finally {
      setLoading(false);
    }
  }, [department_id, token]);

  const fetchTechnicians = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${apiBase}/kiosk/technicians?department_id=${department_id}`,
        { headers }
      );
      setTechnicians(data);
    } catch {}
  }, [department_id, token]);

  useEffect(() => {
    fetchIssues();
    fetchTechnicians();

    // Auto-refresh every 30 seconds
    timerRef.current = setInterval(fetchIssues, POLL_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchIssues, fetchTechnicians]);

  // Countdown display
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 30 : c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastRefresh]);

  const handleClose = async () => {
    if (!selected || !techId) return;
    setClosing(true);
    try {
      await axios.post(
        `${apiBase}/kiosk/issues/${selected.id}/close`,
        { technician_id: techId },
        { headers }
      );
      setIssues((prev) => prev.filter((i) => i.id !== selected.id));
      setSelected(null);
      setTechId('');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to close issue.');
    } finally {
      setClosing(false);
    }
  };

  const elapsed = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      {/* Kiosk header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {issues[0]?.department_name || 'Department'} — Open Issues
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Tap an issue to mark it complete</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setLoading(true); fetchIssues(); }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <div className="text-gray-600 text-xs text-right">
            <p>Auto-refresh in</p>
            <p className="text-brand-400 font-mono font-bold text-lg">{countdown}s</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
        </div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-600">
          <CheckCircle className="w-20 h-20 mb-4 opacity-30" />
          <p className="text-2xl font-bold">All Clear!</p>
          <p className="text-base mt-1">No open issues for this department.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map((issue) => (
            <button
              key={issue.id}
              onClick={() => { setSelected(issue); setTechId(''); }}
              className="bg-gray-900 border-2 border-gray-700 hover:border-brand-500 rounded-2xl p-5 text-left transition group active:scale-95"
            >
              {/* Vehicle */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-brand-900/40 border border-brand-700/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Car className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">
                    {[issue.make, issue.model].filter(Boolean).join(' ') || 'Unknown Vehicle'}
                  </p>
                  <p className="text-brand-300 font-mono text-sm">{issue.vin}</p>
                  {issue.stock_number && (
                    <p className="text-gray-500 text-xs">Stock #{issue.stock_number}</p>
                  )}
                </div>
              </div>

              {/* Issue description */}
              <p className="text-gray-200 text-base font-medium leading-snug mb-3 line-clamp-3">
                {issue.description}
              </p>

              {/* Footer */}
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>{elapsed(issue.opened_at)}</span>
              </div>

              <div className="mt-3 w-full bg-brand-600 group-hover:bg-brand-500 text-white text-sm font-bold py-2.5 rounded-xl transition text-center">
                Mark Complete
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Close Issue Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Close Issue</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Vehicle info */}
              <div className="bg-brand-900/20 border border-brand-700/40 rounded-xl p-4">
                <p className="text-white font-bold text-lg">
                  {[selected.make, selected.model].filter(Boolean).join(' ') || 'Unknown Vehicle'}
                </p>
                <p className="text-brand-300 font-mono text-sm">{selected.vin}</p>
              </div>

              {/* Issue description */}
              <div>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Issue</p>
                <p className="text-white text-base">{selected.description}</p>
              </div>

              {/* Technician selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Your Name *
                </label>
                <div className="relative">
                  <select
                    value={techId}
                    onChange={(e) => setTechId(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 transition appearance-none"
                  >
                    <option value="">— Select Technician —</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium py-3 rounded-xl transition text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClose}
                  disabled={closing || !techId}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-base flex items-center justify-center gap-2"
                >
                  {closing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Closing…</>
                  ) : (
                    <><CheckCircle className="w-5 h-5" />Mark Complete</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
