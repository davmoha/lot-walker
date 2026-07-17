import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Loader2, Download, BarChart3, Clock, Wrench, TrendingUp } from 'lucide-react';

interface TimeToLineRow {
  vin: string;
  stock_number?: string;
  make?: string;
  model?: string;
  imported_at: string;
  last_issue_closed: string;
  days_to_line: number;
}

interface DeptRow {
  department: string;
  total_issues: number;
  closed_issues: number;
  avg_hours_to_close: number | null;
}

interface TechRow {
  technician: string;
  department?: string;
  tickets_closed: number;
  avg_hours_per_ticket: number | null;
}

interface Summary {
  open_issues: number;
  closed_issues: number;
  total_issues: number;
  avg_close_hours: number | null;
}

interface ReportData {
  time_to_line: TimeToLineRow[];
  dept_bottleneck: DeptRow[];
  tech_velocity: TechRow[];
  summary: Summary;
}

const CHART_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e'];

function getDefaultDates() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export default function ReportsPage() {
  const defaults = getDefaultDates();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ttl' | 'dept' | 'tech'>('ttl');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data: result } = await api.get<ReportData>(`/reports/summary?from=${from}&to=${to}`);
      setData(result);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async (report: string) => {
    try {
      const response = await api.get(`/reports/export/csv?from=${from}&to=${to}&report=${report}`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lot-walker-${report}-${from}-${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed.');
    }
  };

  const tabs = [
    { id: 'ttl' as const, label: 'Time to Line', icon: TrendingUp },
    { id: 'dept' as const, label: 'Dept Bottleneck', icon: Clock },
    { id: 'tech' as const, label: 'Tech Velocity', icon: Wrench },
  ];

  const reportKeyMap: Record<string, string> = {
    ttl: 'time_to_line',
    dept: 'dept_bottleneck',
    tech: 'tech_velocity',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Measure lot throughput, department performance, and technician productivity.</p>
        </div>
      </div>

      {/* Date range + run */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition" />
        </div>
        {/* Quick ranges */}
        {[
          { label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '90d', days: 90 },
        ].map(({ label, days }) => (
          <button key={label} onClick={() => {
            const t = new Date(); const f = new Date();
            f.setDate(f.getDate() - days);
            setFrom(f.toISOString().split('T')[0]);
            setTo(t.toISOString().split('T')[0]);
          }} className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-lg transition">
            Last {label}
          </button>
        ))}
        <button onClick={fetchReport} disabled={loading}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-lg transition text-sm">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Loading…</> : <><BarChart3 className="w-4 h-4" />Run Report</>}
        </button>
      </div>

      {!data && !loading && (
        <div className="text-center py-20 text-gray-600">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a date range and click Run Report.</p>
        </div>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Issues', value: data.summary.total_issues, color: 'text-white' },
              { label: 'Closed', value: data.summary.closed_issues, color: 'text-green-400' },
              { label: 'Open', value: data.summary.open_issues, color: 'text-red-400' },
              { label: 'Avg Close Time', value: data.summary.avg_close_hours != null ? `${data.summary.avg_close_hours}h` : '—', color: 'text-brand-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs font-medium mb-1">{label}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === id ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Export button */}
          <div className="flex justify-end mb-3">
            <button onClick={() => exportCSV(reportKeyMap[activeTab])}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-lg transition">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          {/* Time to Line */}
          {activeTab === 'ttl' && (
            <div className="space-y-4">
              {data.time_to_line.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No completed vehicles in this range.</p>
              ) : (
                <>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.time_to_line.slice(0, 15)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="vin" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => v.slice(-6)} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} unit="d" />
                        <Tooltip
                          contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#f9fafb' }}
                          formatter={(v: any) => [`${v} days`, 'Days to Line']}
                        />
                        <Bar dataKey="days_to_line" radius={[4, 4, 0, 0]}>
                          {data.time_to_line.slice(0, 15).map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-800">
                        <th className="text-left px-4 py-3 text-gray-400 font-medium">VIN</th>
                        <th className="text-left px-4 py-3 text-gray-400 font-medium">Stock #</th>
                        <th className="text-left px-4 py-3 text-gray-400 font-medium">Vehicle</th>
                        <th className="text-left px-4 py-3 text-gray-400 font-medium">Imported</th>
                        <th className="text-right px-4 py-3 text-gray-400 font-medium">Days to Line</th>
                      </tr></thead>
                      <tbody>
                        {data.time_to_line.map((row, i) => (
                          <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            <td className="px-4 py-3 font-mono text-xs text-gray-300">{row.vin}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{row.stock_number || '—'}</td>
                            <td className="px-4 py-3 text-white">{[row.make, row.model].filter(Boolean).join(' ') || '—'}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{new Date(row.imported_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-bold ${row.days_to_line > 7 ? 'text-red-400' : row.days_to_line > 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                                {row.days_to_line}d
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Department Bottleneck */}
          {activeTab === 'dept' && (
            <div className="space-y-4">
              {data.dept_bottleneck.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No department data in this range.</p>
              ) : (
                <>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.dept_bottleneck} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="department" tick={{ fill: '#6b7280', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} unit="h" />
                        <Tooltip
                          contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={(v: any) => [`${v}h`, 'Avg Hours to Close']}
                        />
                        <Bar dataKey="avg_hours_to_close" radius={[4, 4, 0, 0]}>
                          {data.dept_bottleneck.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-800">
                        <th className="text-left px-4 py-3 text-gray-400 font-medium">Department</th>
                        <th className="text-right px-4 py-3 text-gray-400 font-medium">Total Issues</th>
                        <th className="text-right px-4 py-3 text-gray-400 font-medium">Closed</th>
                        <th className="text-right px-4 py-3 text-gray-400 font-medium">Avg Hours to Close</th>
                      </tr></thead>
                      <tbody>
                        {data.dept_bottleneck.map((row, i) => (
                          <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            <td className="px-4 py-3 text-white font-medium">{row.department}</td>
                            <td className="px-4 py-3 text-right text-gray-300">{row.total_issues}</td>
                            <td className="px-4 py-3 text-right text-green-400">{row.closed_issues}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-bold ${
                                row.avg_hours_to_close == null ? 'text-gray-500' :
                                row.avg_hours_to_close > 24 ? 'text-red-400' :
                                row.avg_hours_to_close > 8 ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                                {row.avg_hours_to_close != null ? `${row.avg_hours_to_close}h` : '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tech Velocity */}
          {activeTab === 'tech' && (
            <div className="space-y-4">
              {data.tech_velocity.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No technician data in this range.</p>
              ) : (
                <>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.tech_velocity} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="technician" tick={{ fill: '#6b7280', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={(v: any) => [v, 'Tickets Closed']}
                        />
                        <Bar dataKey="tickets_closed" radius={[4, 4, 0, 0]}>
                          {data.tech_velocity.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-800">
                        <th className="text-left px-4 py-3 text-gray-400 font-medium">Technician</th>
                        <th className="text-left px-4 py-3 text-gray-400 font-medium">Department</th>
                        <th className="text-right px-4 py-3 text-gray-400 font-medium">Tickets Closed</th>
                        <th className="text-right px-4 py-3 text-gray-400 font-medium">Avg Hrs/Ticket</th>
                      </tr></thead>
                      <tbody>
                        {data.tech_velocity.map((row, i) => (
                          <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            <td className="px-4 py-3 text-white font-medium">{row.technician}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{row.department || '—'}</td>
                            <td className="px-4 py-3 text-right text-brand-400 font-bold text-lg">{row.tickets_closed}</td>
                            <td className="px-4 py-3 text-right text-gray-300">
                              {row.avg_hours_per_ticket != null ? `${row.avg_hours_per_ticket}h` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
