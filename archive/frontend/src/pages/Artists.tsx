import { useArtists } from '../hooks/useArtists';
import ArtistCard from '../components/ArtistCard';
import { Users } from 'lucide-react';

export default function Artists() {
  const { data, isLoading } = useArtists(1, 40);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
        <Users size={22} className="text-moon-400" /> Artists
      </h1>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="h-48 bg-dark-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data?.artists.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No artists yet</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data?.artists.map((a) => <ArtistCard key={a.id} artist={a} />)}
        </div>
      )}
    </div>
  );
}
