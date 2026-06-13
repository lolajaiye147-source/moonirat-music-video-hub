import { useFollowedArtists } from '../hooks/useFollows';
import ArtistCard from '../components/ArtistCard';
import { Star } from 'lucide-react';

export default function Following() {
  const { data, isLoading } = useFollowedArtists();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
        <Star size={22} className="text-moon-400" /> Artists I Follow
      </h1>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-48 bg-dark-700 rounded-xl animate-pulse" />)}
        </div>
      ) : data?.artists.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Star size={40} className="mx-auto mb-3 opacity-30" />
          <p>You haven't followed any artists yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {data?.artists.map((a) => <ArtistCard key={a.id} artist={a} />)}
        </div>
      )}
    </div>
  );
}
