'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Film, Users } from 'lucide-react';
import { searchService } from '@/services/search.service';
import { type Video } from '@/services/video.service';
import { type ArtistProfile } from '@/services/artist.service';
import VideoCard from '@/components/VideoCard';
import ArtistCard from '@/components/ArtistCard';
import SkeletonCard, { SkeletonArtistCard } from '@/components/SkeletonCard';
import clsx from 'clsx';

type Tab = 'videos' | 'artists';

export default function SearchPage() {
  const [q, setQ]               = useState('');
  const [tab, setTab]           = useState<Tab>('videos');
  const [videos, setVideos]     = useState<Video[]>([]);
  const [artists, setArtists]   = useState<ArtistProfile[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) { setVideos([]); setArtists([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const [vRes, aRes] = await Promise.all([
        searchService.searchVideos(query),
        searchService.searchArtists(query),
      ]);
      setVideos(vRes.videos);
      setArtists(aRes.artists);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(q), 400);
    return () => clearTimeout(t);
  }, [q, search]);

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'videos',  label: 'Videos',  count: videos.length,  icon: <Film className="w-4 h-4" /> },
    { key: 'artists', label: 'Artists', count: artists.length, icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search videos, artists…" autoFocus
          className="input pl-12 text-base h-12"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-700 pb-0">
        {tabs.map(({ key, label, count, icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-moon-500 text-moon-400'
                : 'border-transparent text-gray-500 hover:text-gray-300',
            )}>
            {icon} {label}
            {searched && <span className="ml-1 text-xs bg-dark-700 px-1.5 py-0.5 rounded-full">{count}</span>}
          </button>
        ))}
      </div>

      {/* Results */}
      {!searched && (
        <div className="text-center py-20 text-gray-600">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Start typing to search Moonirat</p>
        </div>
      )}

      {tab === 'videos' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : videos.length === 0 && searched
              ? <p className="text-gray-500 text-sm col-span-full py-8 text-center">No videos found for &ldquo;{q}&rdquo;</p>
              : videos.map((v) => <VideoCard key={v.id} video={v} />)
          }
        </div>
      )}

      {tab === 'artists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonArtistCard key={i} />)
            : artists.length === 0 && searched
              ? <p className="text-gray-500 text-sm col-span-full py-8 text-center">No artists found for &ldquo;{q}&rdquo;</p>
              : artists.map((a) => <ArtistCard key={a.id} artist={a} />)
          }
        </div>
      )}
    </div>
  );
}
