'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Home, ListMusic, User, LogOut, Music2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';

const links = [
  { href: '/',          label: 'Home',     icon: Home },
  { href: '/search',   label: 'Search',   icon: Search },
  { href: '/playlists',label: 'Playlists', icon: ListMusic },
  { href: '/me',       label: 'Profile',  icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <>
      {/* Desktop top bar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-dark-900/90 backdrop-blur-md border-b border-dark-700 h-16 hidden md:flex items-center px-6 gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white shrink-0">
          <Music2 className="w-5 h-5 text-moon-400" />
          Moonirat
        </Link>

        <nav className="flex items-center gap-1 ml-4">
          {links.slice(0, 2).map(({ href, label }) => (
            <Link
              key={href} href={href}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href ? 'bg-dark-700 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-700',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link href="/playlists" className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors', pathname === '/playlists' ? 'bg-dark-700 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-700')}>
                Playlists
              </Link>
              <Link href="/me" className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2', pathname === '/me' ? 'text-moon-400' : 'text-gray-400 hover:text-white')}>
                <User className="w-4 h-4" />
                {user?.email?.split('@')[0]}
              </Link>
              <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-dark-700">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost text-sm py-2 px-4">Sign in</Link>
              <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">Join free</Link>
            </>
          )}
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-dark-900/95 backdrop-blur-md border-t border-dark-700 flex md:hidden">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={clsx(
            'flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors',
            pathname === href ? 'text-moon-400' : 'text-gray-500 hover:text-gray-300',
          )}>
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
