import { useAuth } from '../context/AuthContext';
import { Car, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { user, company } = useAuth();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">{company?.name} — Lot Management Dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Vehicles', value: '—', icon: Car, color: 'text-brand-400', bg: 'bg-brand-900/30' },
          { label: 'Open Issues', value: '—', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-900/20' },
          { label: 'Closed Today', value: '—', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20' },
          { label: 'Avg. Close Time', value: '—', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm font-medium">{label}</p>
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500">
        <p className="text-sm">Full dashboard stats will be populated in Phase 9 (Reporting & Analytics).</p>
      </div>
    </div>
  );
}
