import { useState, useRef } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Upload, Loader2, CheckCircle, AlertTriangle, ChevronDown, FileText } from 'lucide-react';

const CANONICAL_FIELDS = ['vin', 'stock_number', 'make', 'model', 'trim', 'color', 'mileage', 'status'];
const FIELD_LABELS: Record<string, string> = {
  vin: 'VIN *',
  stock_number: 'Stock Number',
  make: 'Make',
  model: 'Model',
  trim: 'Trim / Style',
  color: 'Color',
  mileage: 'Mileage',
  status: 'Status',
};

interface PreviewData {
  raw_headers: string[];
  suggested_mapping: Record<string, string>;
  preview_rows: any[];
  total_rows: number;
}

interface ImportResult {
  message: string;
  imported: number;
  skipped: number;
  errors: { vin: string; error: string }[];
}

type Step = 'upload' | 'mapping' | 'result';

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 1: Upload and preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const { data } = await api.post<PreviewData>('/import/preview', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data);
      // Invert suggested_mapping: canonical -> raw header
      const invertedMapping: Record<string, string> = {};
      for (const [canonical, raw] of Object.entries(data.suggested_mapping)) {
        invertedMapping[canonical] = raw;
      }
      setMapping(invertedMapping);
      setStep('mapping');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to parse CSV.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm mapping and import
  const handleConfirm = async () => {
    if (!file) return;
    if (!mapping.vin) {
      toast.error('You must map the VIN column before importing.');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mapping', JSON.stringify(mapping));
      const { data } = await api.post<ImportResult>('/import/confirm', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setStep('result');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Import failed.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setMapping({});
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">CSV Import</h1>
        <p className="text-gray-400 text-sm mt-0.5">Upload a DMS export to import or update your inventory.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(['upload', 'mapping', 'result'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
              step === s ? 'bg-brand-600 border-brand-500 text-white' :
              (['upload', 'mapping', 'result'].indexOf(step) > i) ? 'bg-green-700 border-green-600 text-white' :
              'bg-gray-800 border-gray-700 text-gray-500'
            }`}>{i + 1}</div>
            <span className={`text-sm ${step === s ? 'text-white font-medium' : 'text-gray-500'}`}>
              {s === 'upload' ? 'Upload' : s === 'mapping' ? 'Map Columns' : 'Results'}
            </span>
            {i < 2 && <div className="w-8 h-px bg-gray-700 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-700 hover:border-brand-500 rounded-2xl p-12 text-center cursor-pointer transition group"
        >
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
          {loading ? (
            <Loader2 className="w-10 h-10 text-brand-400 animate-spin mx-auto mb-3" />
          ) : (
            <Upload className="w-10 h-10 text-gray-600 group-hover:text-brand-400 mx-auto mb-3 transition" />
          )}
          <p className="text-white font-semibold mb-1">Drop your CSV here or click to browse</p>
          <p className="text-gray-500 text-sm">Supports CDK, Reynolds & Reynolds, DealerSocket, and any standard DMS export</p>
          <p className="text-gray-600 text-xs mt-2">Max 10 MB · CSV format only</p>
        </div>
      )}

      {/* Step 2: Mapping confirmation */}
      {step === 'mapping' && preview && (
        <div className="space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <div>
              <p className="text-white text-sm font-medium">{file?.name}</p>
              <p className="text-gray-400 text-xs">{preview.total_rows} rows detected</p>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-base font-semibold text-white mb-1">Column Mapping</h2>
            <p className="text-gray-400 text-sm mb-4">Confirm how your CSV columns map to inventory fields. Auto-detected mappings are pre-filled.</p>

            <div className="space-y-3">
              {CANONICAL_FIELDS.map((field) => (
                <div key={field} className="flex items-center gap-4">
                  <label className="w-36 text-sm font-medium text-gray-300 flex-shrink-0">{FIELD_LABELS[field]}</label>
                  <div className="relative flex-1">
                    <select
                      value={mapping[field] || ''}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition appearance-none"
                    >
                      <option value="">— Skip this field —</option>
                      {preview.raw_headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {mapping[field] && (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview table */}
          {preview.preview_rows.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800">
                <p className="text-sm font-medium text-white">Preview (first {preview.preview_rows.length} rows)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {CANONICAL_FIELDS.filter((f) => mapping[f]).map((f) => (
                        <th key={f} className="text-left px-4 py-2 text-gray-400 font-medium whitespace-nowrap">{FIELD_LABELS[f]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview_rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-800/50">
                        {CANONICAL_FIELDS.filter((f) => mapping[f]).map((f) => (
                          <td key={f} className="px-4 py-2 text-gray-300 whitespace-nowrap font-mono">{row[f] ?? '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium py-2.5 rounded-lg transition text-sm">
              Start Over
            </button>
            <button onClick={handleConfirm} disabled={loading || !mapping.vin}
              className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Importing…</> : `Import ${preview.total_rows} Vehicles`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-700/40 rounded-xl p-5 flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold">{result.message}</p>
              <div className="flex gap-6 mt-2">
                <div><p className="text-green-400 text-2xl font-bold">{result.imported}</p><p className="text-gray-400 text-xs">Upserted</p></div>
                <div><p className="text-yellow-400 text-2xl font-bold">{result.skipped}</p><p className="text-gray-400 text-xs">Skipped</p></div>
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-red-300 text-sm font-medium">Row Errors ({result.errors.length})</p>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-gray-400 font-mono">VIN {e.vin}: {e.error}</p>
                ))}
              </div>
            </div>
          )}

          <button onClick={reset}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-lg transition text-sm">
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}
