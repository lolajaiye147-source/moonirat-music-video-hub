import { Link } from 'react-router-dom';
import { Users, CheckCircle } from 'lucide-react';
import { Artist } from '../types';

interface Props { artist: Artist; }

export default function ArtistCard({ artist }: Props) {
  return (
    <Link to={`/artists/${artist.id}`} className="group flex flex-col items-center text-center p-4 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 hover:border-moon-700 transition-all">
      <div className="w-20 h-20 rounded-full overflow-hidden mb-3 ring-2 ring-dark-600 group-hover:ring-moon-500 transition-all">
        {artist.profileImage ? (
          <img src={artist.profileImage} alt={artist.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-moon-600 to-purple-700 flex items-center justify-center text-2xl font-bold text-white">
            {artist.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <h3 className="font-semibold text-white text-sm group-hover:text-moon-300 transition-colors">{artist.name}</h3>
        {artist.verified && <CheckCircle size={14} className="text-moon-400" />}
      </div>
      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
        <Users size={12} />
        <span>{artist.followersCount.toLocaleString()} followers</span>
      </div>
      {artist.bio && <p className="mt-2 text-xs text-gray-500 line-clamp-2">{artist.bio}</p>}
    </Link>
  );
}
