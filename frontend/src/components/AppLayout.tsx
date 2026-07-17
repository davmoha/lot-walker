import { Outlet, NavLink } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  Car,
  AlertCircle,
  BarChart3,
  Settings,
  Upload,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['company_admin', 'employee', 'super_admin'] },
  { to: '/super-admin', icon: Building2, label: 'Companies', roles: ['super_admin'] },
  { to: '/admin/users', icon: Users, label: 'Users', roles: ['company_admin', 'super_admin'] },
  { to: '/admin/departments', icon: Building2, label: 'Departments', roles: ['company_admin', 'super_admin'] },
  { to: '/admin/technicians', icon: Wrench, label: 'Technicians', roles: ['company_admin', 'super_admin'] },
  { to: '/inventory', icon: Car, label: 'Inventory', roles: ['company_admin', 'employee', 'super_admin'] },
  { to: '/issues', icon: AlertCircle, label: 'Issues', roles: ['company_admin', 'employee', 'super_admin'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['company_admin', 'super_admin'] },
  { to: '/admin/import', icon: Upload, label: 'CSV Import', roles: ['company_admin', 'super_admin'] },
  { to: '/admin/settings', icon: Settings, label: 'Settings', roles: ['company_admin', 'super_admin'] },
];

export default function AppLayout() {
  const { user } = useAuth();

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-gray-900 border-r border-gray-800 flex-shrink-0 hidden md:flex flex-col py-4">
          <nav className="flex-1 px-2 space-y-0.5">
            {visibleItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
