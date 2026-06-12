import { Link } from 'react-router-dom';
import { useTrending, useNewReleases } from '../hooks/useVideos';
import VideoCard from '../components/VideoCard';
import { TrendingUp, Sparkles } from 'lucide-react';

export default function Home() {
  const { data: trending, isLoading: trendingLoading } = useTrending(8);
  const { data: newReleases, isLoading: newLoading } = useNewReleases(8);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-moon-900 via-purple-900 to-dark-800 p-8 md:p-12">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-moon-400 to-transparent" />
        <div className="relative">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
            Music Videos,<br />
            <span className="bg-gradient-to-r from-moon-300 to-purple-300 bg-clip-text text-transparent">Rediscovered.</span>
          </h1>
          <p className="text-gray-300 text-lg mb-6 max-w-lg">
            Discover artists, watch their best work, and build playlists from the freshest music videos on the web.
          </p>
          <div className="flex gap-3">
            <Link to="/trending" className="px-6 py-2.5 bg-moon-600 hover:bg-moon-500 text-white rounded-lg font-semibold transition-colors">
              Explore Trending
            </Link>
            <Link to="/artists" className="px-6 py-2.5 border border-white/20 hover:bg-white/10 text-white rounded-lg font-semibold transition-colors">
              Browse Artists
            </Link>
          </div>
        </div>
      </div>

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <TrendingUp size={20} className="text-moon-400" /> Trending Now
          </h2>
          <Link to="/trending" className="text-sm text-moon-400 hover:text-moon-300">View all →</Link>
        </div>
        {trendingLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-video bg-dark-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trending?.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
        )}
      </section>

      {/* New Releases */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <Sparkles size={20} className="text-purple-400" /> New Releases
          </h2>
          <Link to="/new-releases" className="text-sm text-moon-400 hover:text-moon-300">View all →</Link>
        </div>
        {newLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-video bg-dark-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {newReleases?.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
        )}
      </section>
    </div>
  );
}
