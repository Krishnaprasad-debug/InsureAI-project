import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, FileText, History, User, LogOut, Moon, Sun, Menu,
  ShieldCheck, Users, ChevronLeft, Search, Clock, Brain, BarChart3, Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { cn, initials } from '../lib/utils';
import { Badge } from './ui/Badge';
import { NotificationsDropdown } from './NotificationsDropdown';

const customerNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'New Claim', icon: FileText, path: '/claims/new' },
  { label: 'Claim History', icon: History, path: '/claims' },
  { label: 'Profile', icon: User, path: '/profile' },
];

const companyNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/company/dashboard' },
  { label: 'Pending Reviews', icon: Clock, path: '/company/pending' },
  { label: 'All Claims', icon: FileText, path: '/company/claims' },
  { label: 'Predictions', icon: Brain, path: '/company/predictions' },
  { label: 'Analytics', icon: BarChart3, path: '/company/analytics' },
  { label: 'Profile', icon: User, path: '/company/profile' },
];

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Claims', icon: FileText, path: '/admin/claims' },
  { label: 'Users', icon: Users, path: '/admin/users' },
];

export function AppLayout({ admin = false, company = false }: { admin?: boolean; company?: boolean }) {
  const { profile, signOut, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast('success', 'Signed out successfully');
    navigate('/');
  };

  const isCompanyRoute = company || location.pathname.startsWith('/company');
  const navList = isCompanyRoute ? companyNav : admin ? adminNav : customerNav;

  const sidebar = (
    <div className="flex flex-col h-full">
      <Link to="/" className="flex items-center gap-2.5 px-6 py-5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/30">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-xl font-bold tracking-tight">Insure<span className="text-primary-600">AI</span></span>
      </Link>

      {/* Portal Title Badge */}
      <div className="px-4 mb-3">
        {isCompanyRoute ? (
          <div className="px-3 py-1.5 rounded-xl bg-primary-950/40 border border-primary-800/40 flex items-center justify-center">
            <Badge variant="primary" className="bg-primary-600 text-white font-semibold w-full justify-center">
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Company Officer Portal
            </Badge>
          </div>
        ) : admin ? (
          <div className="px-4 mb-2">
            <Badge variant="primary" className="w-full justify-center py-1">Admin Panel</Badge>
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <Badge variant="outline" className="font-semibold text-gray-700 dark:text-gray-300 w-full justify-center">
              <User className="w-3.5 h-3.5 mr-1.5" />
              Customer Portal
            </Badge>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navList.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && item.path !== '/admin' && item.path !== '/company/dashboard' && location.pathname.startsWith(item.path + '/') && location.pathname !== '/claims/new');
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
        <Link
          to={isCompanyRoute ? '/company/profile' : '/profile'}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {initials(profile?.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
          </div>
        </Link>
        <button
          onClick={handleSignOut}
          className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col z-40">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 lg:hidden"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hidden sm:block"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search claims..."
                  className="w-64 pl-9 pr-4 py-2 text-sm rounded-xl bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-primary-500/40 focus:bg-white dark:focus:bg-gray-900 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationsDropdown isCompany={isCompanyRoute} />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              {isAdmin && !admin && (
                <Link to="/admin" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" title="Admin Dashboard">
                  <ShieldCheck className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
