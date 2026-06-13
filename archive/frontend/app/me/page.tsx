'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, ListMusic, History, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { videoService, type Video } from '@/services/video.service';
import { playlistService, type Playlist } from '@/services/playlist.service';
import VideoCard from '@/components/VideoCard';
import Loader from '@/components/Loader';

interface WatchItem { video: Video; watchedAt: string; }

export default function MePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [history, setHistory]     = useState<WatchItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [hLoading, setHLoading]   = useState(true);
  const [pLoading, setPLoading]   = useState(true);
  const [tab, setTab]             = useState<'history' | 'playlists'>('history');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    videoService.getWatchHistory()
      .then((r) => setHistory(r.history ?? []))
      .catch(console.error)
      .finally(() => setHLoading(false));
    playlistService.getMyPlaylists()
      .then(setPlaylists)
      .catch(console.error)
      .finally(() => setPLoading(false));
  }, [isAuthenticated]);

  const handleLogout = () => { logout(); router.push('/'); };

  if (authLoading) return <Loader message="Loading profile…" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Profile header */}
      <div className="card p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-moon-600/20 flex items-center justify-center text-moon-400">
          <User className="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate">{user?.email}</p>
          <span className={`badge mt-1 ${user?.role === 'ARTIST' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'}`}>
            {user?.role === 'ARTIST' ? 'Artist' : 'Fan'}
          </span>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors border border-dark-500 hover:border-red-500/30 rounded-xl px-3 py-2">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-dark-700 mb-6">
        {[
          { key: 'history' as const,   label: 'Watch History', icon: <History className="w-4 h-4" /> },
          { key: 'playlists' as const, label: 'My Playlists',  icon: <ListMusic className="w-4 h-4" /> },
        ].map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === key ? 'border-moon-500 text-moon-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'history' && (
        hLoading ? <Loader message="Loading history…" /> :
        history.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No watch history yet. Start watching!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {history.map((item) => <VideoCard key={item.watchedAt + item.video.id} video={item.video} />)}
          </div>
        )
      )}

      {tab === 'playlists' && (
        pLoading ? <Loader message="Loading playlists…" /> :
        playlists.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <ListMusic className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No playlists yet. <a href="/playlists" className="text-moon-400 hover:underline">Create one</a>.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {playlists.map((pl) => (
              <div key={pl.id} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-moon-400 shrink-0">
                  <ListMusic className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{pl.name}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
