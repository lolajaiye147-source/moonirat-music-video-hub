'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Music2, Eye, EyeOff, User, Mic2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';

type Role = 'VIEWER' | 'ARTIST';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState<Role>('VIEWER');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, role);
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles: { value: Role; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'VIEWER', label: 'Fan',    desc: 'Watch, follow, and discover',         icon: <User className="w-5 h-5" /> },
    { value: 'ARTIST', label: 'Artist', desc: 'Upload music videos and grow an audience', icon: <Mic2 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-moon-600/20 rounded-2xl mb-4">
            <Music2 className="w-6 h-6 text-moon-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join Moonirat</h1>
          <p className="text-gray-500 text-sm mt-1">Free forever. No credit card needed.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role picker */}
          <div className="grid grid-cols-2 gap-3">
            {roles.map(({ value, label, desc, icon }) => (
              <button key={value} type="button" onClick={() => setRole(value)}
                className={clsx(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all',
                  role === value
                    ? 'border-moon-500 bg-moon-600/10 text-moon-400'
                    : 'border-dark-500 bg-dark-800 text-gray-400 hover:border-dark-400',
                )}>
                {icon}
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs opacity-70 leading-tight">{desc}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required className="input" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters" required minLength={8} className="input pr-10" />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full text-center">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-moon-400 hover:text-moon-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
