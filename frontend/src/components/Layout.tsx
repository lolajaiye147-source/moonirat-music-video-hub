import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, TrendingUp, Users, Music, List, Search, LogOut, Menu, X, Star } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/trending', icon: TrendingUp, label: 'Trending' },
  { to: '/artists', icon: Users, label: 'Artists' },
  { to: '/search', icon: Search, label: 'Search' },
];

const authNavItems = [
  { to: '/playlists', icon: List, label: 'Playlists' },
  { to: '/following', icon: Star, label: 'Following' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const NavLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <Link
      to={to}
      onClick={() => setSidebarOpen(false)}
      className={clsx(
        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
        location.pathname === to
          ? 'bg-moon-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-dark-600',
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  );

  return (
    <div className="flex h-screen bg-dark-900 text-white overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:static z-30 h-full w-64 bg-dark-800 border-r border-dark-600 flex flex-col transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="p-6 border-b border-dark-600">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-moon-500 to-purple-600 flex items-center justify-center">
              <Music size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-moon-400 to-purple-400 bg-clip-text text-transparent">
              Moonirat
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => <NavLink key={item.to} {...item} />)}
          {isAuthenticated && (
            <>
              <div className="pt-4 pb-1 px-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Library</span>
              </div>
              {authNavItems.map((item) => <NavLink key={item.to} {...item} />)}
              {user?.role === 'ARTIST' && (
                <>
                  <div className="pt-4 pb-1 px-4">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Artist</span>
                  </div>
                  <NavLink to="/dashboard" icon={Music} label="My Videos" />
                  <NavLink to="/upload" icon={Music} label="Upload Video" />
                </>
              )}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-dark-600">
          {isAuthenticated ? (
            <div className="space-y-2">
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-dark-600 transition-all"
              >
                <LogOut size={18} /> Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link to="/login" className="block w-full text-center py-2 px-4 rounded-lg bg-moon-600 hover:bg-moon-500 text-white text-sm font-medium transition-colors">
                Sign in
              </Link>
              <Link to="/register" className="block w-full text-center py-2 px-4 rounded-lg border border-dark-500 hover:bg-dark-600 text-gray-300 text-sm font-medium transition-colors">
                Register
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-4 p-4 bg-dark-800 border-b border-dark-600">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={22} />
          </button>
          <span className="text-lg font-bold bg-gradient-to-r from-moon-400 to-purple-400 bg-clip-text text-transparent">Moonirat</span>
        </header>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
