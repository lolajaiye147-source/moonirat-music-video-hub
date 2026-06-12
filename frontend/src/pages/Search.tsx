import { useState } from 'react';
import { useSearchVideos } from '../hooks/useVideos';
import VideoCard from '../components/VideoCard';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearchVideos(query);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Search</h1>
      <div className="relative mb-8">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos, artists..."
          className="w-full pl-11 pr-4 py-3 bg-dark-700 border border-dark-500 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-moon-500 transition-colors text-base"
        />
      </div>

      {query.length > 1 && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-video bg-dark-700 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : data?.videos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No results for "{query}"</div>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-4">{data?.total} results for "{query}"</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data?.videos.map((v) => <VideoCard key={v.id} video={v} />)}
              </div>
            </>
          )}
        </>
      )}

      {query.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <SearchIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p>Type to search for music videos</p>
        </div>
      )}
    </div>
  );
}
