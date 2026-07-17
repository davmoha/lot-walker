import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    company_admin: 'Admin',
    employee: 'Employee',
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 h-16 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Logo + Company */}
      <div className="flex items-center gap-3">
        {company?.logo_url ? (
          <img
            src={company.logo_url}
            alt={company.name}
            className="h-9 w-auto max-w-[120px] object-contain rounded"
          />
        ) : (
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Car className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="hidden sm:block">
          <p className="text-white font-semibold text-sm leading-tight">
            {company?.name || 'Lot Walker'}
          </p>
          {company?.dealer_code && (
            <p className="text-gray-500 text-xs">{company.dealer_code}</p>
          )}
        </div>
      </div>

      {/* Right: User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 transition"
        >
          <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-white text-sm font-medium leading-tight">{user?.name}</p>
            <p className="text-gray-400 text-xs">{roleLabel[user?.role || ''] || user?.role}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-700">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-gray-700 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
