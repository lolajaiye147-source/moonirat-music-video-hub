import { useTrending } from '../hooks/useVideos';
import VideoCard from '../components/VideoCard';
import { TrendingUp } from 'lucide-react';

export default function Trending() {
  const { data, isLoading } = useTrending(40);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
        <TrendingUp size={22} className="text-moon-400" /> Trending Videos
      </h1>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-video bg-dark-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data?.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No videos yet</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      )}
    </div>
  );
}
