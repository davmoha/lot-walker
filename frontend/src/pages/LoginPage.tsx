import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Car, Loader2 } from 'lucide-react';

interface CompanyOption {
  id: string;
  name: string;
  dealer_code: string;
}

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [dealerCode, setDealerCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'super_admin' ? '/super-admin' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Load company list for dropdown
  useEffect(() => {
    api.get('/auth/companies')
      .then(({ data }) => setCompanies(data))
      .catch(() => {/* silently fail — manual entry still works */})
      .finally(() => setLoadingCompanies(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerCode || !email || !password) {
      toast.error('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      await login(dealerCode, email, password);
      // redirect handled by useEffect above
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {/* Background gradient orb */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-900 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-700 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand-900/50">
            <Car className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Lot Walker</h1>
          <p className="text-gray-400 mt-1 text-sm">Dealership Lot Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Dealer Code */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Company Code
              </label>
              {loadingCompanies ? (
                <div className="h-10 bg-gray-800 rounded-lg animate-pulse" />
              ) : companies.length > 0 ? (
                <select
                  value={dealerCode}
                  onChange={(e) => setDealerCode(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                  required
                >
                  <option value="">Select your dealership…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.dealer_code}>
                      {c.name} ({c.dealer_code})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={dealerCode}
                  onChange={(e) => setDealerCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DEALER01"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition placeholder-gray-500"
                  required
                />
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@dealership.com"
                autoComplete="email"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition placeholder-gray-500"
                required
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-400 hover:text-brand-300 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition placeholder-gray-500"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © {new Date().getFullYear()} Lot Walker. All rights reserved.
        </p>
      </div>
    </div>
  );
}
