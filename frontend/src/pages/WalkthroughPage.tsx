import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { enqueueIssue } from '../lib/offlineQueue';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import VinScanner from '../components/VinScanner';
import {
  Camera, CameraOff, Search, AlertCircle, CheckCircle,
  Loader2, Wifi, WifiOff, Mic, ChevronDown,
} from 'lucide-react';
import type { Department } from '../types';

interface Vehicle {
  id: string;
  vin: string;
  stock_number?: string;
  make?: string;
  model?: string;
  trim?: string;
  color?: string;
  mileage?: number;
  status?: string;
}

const QUICK_ISSUES = [
  'Paint scratch',
  'Dent / ding',
  'Cracked windshield',
  'Missing floor mat',
  'Low tire pressure',
  'Interior stain',
  'Broken trim piece',
  'Needs detail',
  'Needs oil change',
  'Check engine light',
];

type Mode = 'scan' | 'manual' | 'issue' | 'success';

export default function WalkthroughPage() {
  const { token } = useAuth();
  const [mode, setMode] = useState<Mode>('scan');
  const [scannerActive, setScannerActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data)).catch(() => {});
  }, []);

  const lookupVehicle = useCallback(async (query: string) => {
    const q = query.trim().toUpperCase();
    if (!q) return;
    setLookupLoading(true);
    try {
      const { data } = await api.get(`/inventory/lookup?q=${encodeURIComponent(q)}`);
      if (data) {
        setVehicle(data);
        setMode('issue');
        setDescription('');
        setDepartmentId('');
        setScannerActive(false);
      } else {
        toast.error(`No vehicle found for: ${q}`);
      }
    } catch {
      toast.error('Lookup failed. Check your connection.');
    } finally {
      setLookupLoading(false);
    }
  }, []);

  const handleScan = useCallback((vin: string) => {
    setScannerActive(false);
    lookupVehicle(vin);
  }, [lookupVehicle]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    lookupVehicle(manualInput);
  };

  const handleSaveIssue = async () => {
    if (!vehicle || !description.trim()) {
      toast.error('Please enter an issue description.');
      return;
    }
    setSaving(true);
    const payload = {
      inventory_id: vehicle.id,
      department_id: departmentId || undefined,
      description: description.trim(),
    };

    try {
      if (isOnline) {
        await api.post('/issues', payload);
        toast.success('Issue saved!');
      } else {
        await enqueueIssue({ payload, token: token || '', queuedAt: new Date().toISOString() });
        toast('Issue queued — will sync when online.', { icon: '📶' });
      }
      setLastSaved(`${vehicle.make || ''} ${vehicle.model || ''} — ${description.trim().slice(0, 40)}`);
      setMode('success');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    setVehicle(null);
    setDescription('');
    setDepartmentId('');
    setManualInput('');
    setMode('scan');
    setScannerActive(true);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Lot Walkthrough</h1>
          <p className="text-gray-400 text-xs mt-0.5">Scan VIN or search by stock number</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
          isOnline ? 'bg-green-900/30 border-green-700/40 text-green-400' : 'bg-red-900/30 border-red-700/40 text-red-400'
        }`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* SCAN MODE */}
      {(mode === 'scan' || mode === 'manual') && (
        <div className="space-y-4">
          {/* Camera toggle */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="text-sm font-medium text-white">Camera Scanner</span>
              <button
                onClick={() => setScannerActive((v) => !v)}
                className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                  scannerActive
                    ? 'bg-red-900/40 text-red-400 border border-red-700/40 hover:bg-red-900/60'
                    : 'bg-brand-700/40 text-brand-300 border border-brand-600/40 hover:bg-brand-700/60'
                }`}
              >
                {scannerActive ? <><CameraOff className="w-3.5 h-3.5" />Stop</> : <><Camera className="w-3.5 h-3.5" />Start Camera</>}
              </button>
            </div>

            {scannerActive ? (
              <div className="p-2">
                <VinScanner onScan={handleScan} active={scannerActive} />
                <p className="text-center text-gray-500 text-xs mt-2">Align barcode within the box</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-600">
                <Camera className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm">Tap "Start Camera" to begin scanning</p>
              </div>
            )}
          </div>

          {/* Manual entry */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-sm font-medium text-white mb-3">Manual Entry</p>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                placeholder="VIN or Stock Number…"
                className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition placeholder-gray-500 font-mono"
              />
              <button type="submit" disabled={lookupLoading || !manualInput}
                className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg transition">
                {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE FORM MODE */}
      {mode === 'issue' && vehicle && (
        <div className="space-y-4">
          {/* Vehicle card */}
          <div className="bg-brand-900/20 border border-brand-700/40 rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-bold text-lg">
                  {[vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ') || 'Unknown Vehicle'}
                </p>
                <p className="text-brand-300 font-mono text-sm mt-0.5">{vehicle.vin}</p>
                {vehicle.stock_number && (
                  <p className="text-gray-400 text-xs mt-0.5">Stock #{vehicle.stock_number}</p>
                )}
              </div>
              <div className="text-right">
                {vehicle.color && <p className="text-gray-300 text-sm">{vehicle.color}</p>}
                {vehicle.mileage !== undefined && (
                  <p className="text-gray-500 text-xs">{vehicle.mileage.toLocaleString()} mi</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick-select buttons */}
          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Quick Select</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ISSUES.map((issue) => (
                <button
                  key={issue}
                  onClick={() => setDescription((prev) => prev ? `${prev}, ${issue}` : issue)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-full transition"
                >
                  {issue}
                </button>
              ))}
            </div>
          </div>

          {/* Description textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Issue Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue…"
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition placeholder-gray-500 resize-none"
            />
          </div>

          {/* Department routing */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Route to Department</label>
            <div className="relative">
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition appearance-none"
              >
                <option value="">— Auto-route / Unassigned —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setMode('scan'); setScannerActive(false); }}
              className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium py-3 rounded-xl transition text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveIssue}
              disabled={saving || !description.trim()}
              className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save & Next'}
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS MODE */}
      {mode === 'success' && (
        <div className="text-center py-8 space-y-5">
          <div className="w-16 h-16 bg-green-900/30 border border-green-700/40 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Issue Saved!</p>
            {lastSaved && <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">{lastSaved}</p>}
            {!isOnline && (
              <div className="flex items-center gap-2 justify-center mt-2 text-yellow-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                Queued offline — will sync when connected
              </div>
            )}
          </div>
          <button
            onClick={handleNext}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-2xl transition text-base flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" /> Scan Next Vehicle
          </button>
        </div>
      )}
    </div>
  );
}
