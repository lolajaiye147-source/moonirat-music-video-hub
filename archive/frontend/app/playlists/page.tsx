'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ListMusic, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { playlistService, type Playlist } from '@/services/playlist.service';
import { useAuth } from '@/context/AuthContext';
import VideoCard from '@/components/VideoCard';
import Loader from '@/components/Loader';
import type { Video } from '@/services/video.service';

export default function PlaylistsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [newName, setNewName]     = useState('');
  const [expanded, setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    playlistService.getMyPlaylists().then(setPlaylists).catch(console.error).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const createPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const p = await playlistService.createPlaylist(newName.trim());
      setPlaylists((prev) => [p, ...prev]);
      setNewName('');
    } catch {}
    setCreating(false);
  };

  const deletePlaylist = async (id: string) => {
    try {
      await playlistService.deletePlaylist(id);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } catch {}
  };

  if (authLoading || loading) return <Loader message="Loading playlists…" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <ListMusic className="w-6 h-6 text-moon-400" />
        <h1 className="text-2xl font-bold text-white">My Playlists</h1>
      </div>

      {/* Create form */}
      <form onSubmit={createPlaylist} className="flex gap-3 mb-8">
        <input
          value={newName} onChange={(e) => setNewName(e.target.value)}
          placeholder="New playlist name…" className="input flex-1"
        />
        <button type="submit" disabled={creating || !newName.trim()} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          {creating ? 'Creating…' : 'Create'}
        </button>
      </form>

      {/* List */}
      {playlists.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <ListMusic className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">You have no playlists yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {playlists.map((pl) => (
            <div key={pl.id} className="card">
              <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(expanded === pl.id ? null : pl.id)}>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{pl.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {pl.items?.length ?? 0} video{(pl.items?.length ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); deletePlaylist(pl.id); }}
                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expanded === pl.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </div>

              {expanded === pl.id && pl.items && pl.items.length > 0 && (
                <div className="border-t border-dark-700 p-4 grid grid-cols-2 gap-3">
                  {pl.items.map((item) => (
                    <VideoCard key={item.id} video={{ ...item.video, description: null, videoUrl: '', duration: null, status: 'READY', createdAt: '', artistId: '', artist: { id: '', name: item.video.artist?.name ?? '', profileImage: null, verified: false } } as Video} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
