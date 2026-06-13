'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Share2, Eye, Clock, BadgeCheck } from 'lucide-react';
import { videoService, type Video } from '@/services/video.service';
import { followService } from '@/services/follow.service';
import VideoPlayer from '@/components/VideoPlayer';
import Loader from '@/components/Loader';
import { useAuth } from '@/context/AuthContext';

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'Today';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [video, setVideo]         = useState<Video | null>(null);
  const [loading, setLoading]     = useState(true);
  const [following, setFollowing] = useState(false);
  const [fLoading, setFLoading]   = useState(false);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    if (!id) return;
    videoService.getVideoById(id)
      .then(setVideo)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handlePlay = () => {
    if (id) videoService.incrementViews(id).catch(() => {});
    if (id && isAuthenticated) videoService.recordWatch(id).catch(() => {});
  };

  const toggleFollow = async () => {
    if (!video?.artist?.id || !isAuthenticated) return;
    setFLoading(true);
    try {
      if (following) { await followService.unfollowArtist(video.artist.id); setFollowing(false); }
      else           { await followService.followArtist(video.artist.id);   setFollowing(true); }
    } catch {}
    setFLoading(false);
  };

  const share = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <Loader message="Loading video…" />;
  if (!video)  return <div className="text-center py-24 text-gray-500">Video not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Player */}
      <VideoPlayer src={video.videoUrl} poster={video.thumbnailUrl} autoPlay onPlay={handlePlay} />

      {/* Meta */}
      <div className="mt-5 space-y-4">
        <h1 className="text-xl md:text-2xl font-bold text-white leading-snug">{video.title}</h1>

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{video.views.toLocaleString()} views</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{timeAgo(video.createdAt)}</span>
          <button onClick={share}
            className="flex items-center gap-1.5 ml-auto text-gray-400 hover:text-moon-400 transition-colors border border-dark-500 rounded-lg px-3 py-1.5">
            <Share2 className="w-3.5 h-3.5" />
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>

        {/* Artist row */}
        {video.artist && (
          <div className="flex items-center gap-4 pt-2 border-t border-dark-700">
            <Link href={`/artist/${video.artist.id}`} className="flex items-center gap-3 group min-w-0">
              <div className="w-10 h-10 rounded-full bg-moon-600/20 flex items-center justify-center text-moon-400 font-bold text-sm shrink-0">
                {video.artist.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-white text-sm group-hover:text-moon-300 transition-colors truncate">
                    {video.artist.name}
                  </span>
                  {video.artist.verified && <BadgeCheck className="w-4 h-4 text-moon-400 shrink-0" />}
                </div>
              </div>
            </Link>
            {isAuthenticated && (
              <button onClick={toggleFollow} disabled={fLoading}
                className={`ml-auto shrink-0 ${following ? 'btn-ghost' : 'btn-primary'} text-sm py-2 px-4`}>
                {fLoading ? '…' : following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        )}

        {/* Description */}
        {video.description && (
          <div className="bg-dark-800 rounded-xl p-4 text-sm text-gray-400 leading-relaxed border border-dark-700">
            {video.description}
          </div>
        )}
      </div>
    </div>
  );
}
