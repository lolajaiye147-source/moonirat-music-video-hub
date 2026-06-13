import { Link } from 'react-router-dom';
import { Eye, CheckCircle } from 'lucide-react';
import { Video } from '../types';

interface Props { video: Video; }

export default function VideoCard({ video }: Props) {
  return (
    <Link to={`/videos/${video.id}`} className="group block">
      <div className="relative aspect-video bg-dark-700 rounded-xl overflow-hidden mb-3">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-moon-900 to-dark-700 flex items-center justify-center">
            <span className="text-4xl">🎵</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 duration-200">
            <span className="ml-1 text-dark-900 text-lg">▶</span>
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-moon-300 transition-colors">{video.title}</h3>
        {video.artist && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-gray-400">{video.artist.name}</span>
            {video.artist.verified && <CheckCircle size={12} className="text-moon-400" />}
          </div>
        )}
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <Eye size={11} />
          <span>{video.views.toLocaleString()} views</span>
        </div>
      </div>
    </Link>
  );
}
