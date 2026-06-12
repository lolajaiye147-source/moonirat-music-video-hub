'use client';

import { useEffect, useState, useRef } from 'react';
import { TrendingUp, Sparkles, Users } from 'lucide-react';
import { videoService, type Video, type FeedResponse } from '@/services/video.service';
import VideoCard from '@/components/VideoCard';
import SkeletonCard from '@/components/SkeletonCard';
import { useAuth } from '@/context/AuthContext';

function Section({ title, icon, videos, loading }: {
  title: string; icon: React.ReactNode; videos: Video[]; loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4 px-4 md:px-0">
        <span className="text-moon-400">{icon}</span>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 px-4 md:px-0 snap-x snap-mandatory
                   scrollbar-thin scrollbar-track-dark-800 scrollbar-thumb-dark-500"
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-64 shrink-0">
                <SkeletonCard />
              </div>
            ))
          : videos.map((v) => (
              <div key={v.id} className="w-64 shrink-0 snap-start">
                <VideoCard video={v} />
              </div>
            ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [feed, setFeed]     = useState<FeedResponse>({ trending: [], newReleases: [], followed: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    videoService.getFeed()
      .then(setFeed)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-0 md:px-6 py-6 pb-24 md:pb-6">
      {/* Hero */}
      <div className="px-4 md:px-0 mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
          Discover great <span className="text-moon-400">music videos</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm">Watch, follow, and explore your next favourite artist.</p>
      </div>

      {isAuthenticated && feed.followed.length > 0 && (
        <Section
          title="From artists you follow"
          icon={<Users className="w-5 h-5" />}
          videos={feed.followed}
          loading={loading}
        />
      )}

      <Section
        title="Trending now"
        icon={<TrendingUp className="w-5 h-5" />}
        videos={feed.trending}
        loading={loading}
      />

      <Section
        title="New releases"
        icon={<Sparkles className="w-5 h-5" />}
        videos={feed.newReleases}
        loading={loading}
      />
    </div>
  );
}
