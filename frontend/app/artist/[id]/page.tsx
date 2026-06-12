'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { BadgeCheck, Users } from 'lucide-react';
import { artistService, type ArtistProfile } from '@/services/artist.service';
import { followService } from '@/services/follow.service';
import { type Video } from '@/services/video.service';
import VideoCard from '@/components/VideoCard';
import Loader from '@/components/Loader';
import SkeletonCard from '@/components/SkeletonCard';
import { useAuth } from '@/context/AuthContext';

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const [artist, setArtist]       = useState<ArtistProfile | null>(null);
  const [videos, setVideos]       = useState<Video[]>([]);
  const [loading, setLoading]     = useState(true);
  const [vLoading, setVLoading]   = useState(true);
  const [following, setFollowing] = useState(false);
  const [fLoading, setFLoading]   = useState(false);

  useEffect(() => {
    if (!id) return;
    artistService.getArtist(id).then(setArtist).catch(console.error).finally(() => setLoading(false));
    artistService.getArtistVideos(id).then((r) => setVideos(r.videos)).catch(console.error).finally(() => setVLoading(false));
  }, [id]);

  const toggleFollow = async () => {
    if (!id || !isAuthenticated) return;
    setFLoading(true);
    try {
      if (following) { await followService.unfollowArtist(id); setFollowing(false); setArtist((a) => a ? { ...a, followersCount: a.followersCount - 1 } : a); }
      else           { await followService.followArtist(id);   setFollowing(true);  setArtist((a) => a ? { ...a, followersCount: a.followersCount + 1 } : a); }
    } catch {}
    setFLoading(false);
  };

  if (loading) return <Loader message="Loading artist…" />;
  if (!artist) return <div className="text-center py-24 text-gray-500">Artist not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-dark-600 border-2 border-dark-500 shrink-0">
          {artist.profileImage ? (
            <Image src={artist.profileImage} alt={artist.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-moon-400">
              {artist.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{artist.name}</h1>
            {artist.verified && (
              <span className="badge bg-moon-600/20 text-moon-400 border border-moon-500/30">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
            <Users className="w-4 h-4" />
            <span>{artist.followersCount.toLocaleString()} followers</span>
          </div>
          {artist.bio && <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-prose">{artist.bio}</p>}
        </div>

        {isAuthenticated && (
          <button onClick={toggleFollow} disabled={fLoading}
            className={`shrink-0 ${following ? 'btn-ghost' : 'btn-primary'} text-sm`}>
            {fLoading ? '…' : following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Videos */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Videos <span className="text-gray-600 font-normal text-sm ml-1">({videos.length})</span></h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {vLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : videos.length === 0
            ? <p className="text-gray-500 text-sm col-span-full py-8 text-center">No videos yet.</p>
            : videos.map((v) => <VideoCard key={v.id} video={v} />)
        }
      </div>
    </div>
  );
}
