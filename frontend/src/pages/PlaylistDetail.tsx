import { useParams, Link } from 'react-router-dom';
import { usePlaylist, useRemoveFromPlaylist } from '../hooks/usePlaylists';
import VideoCard from '../components/VideoCard';
import toast from 'react-hot-toast';
import { X, List } from 'lucide-react';

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: playlist, isLoading } = usePlaylist(id!);
  const removeFromPlaylist = useRemoveFromPlaylist();

  const handleRemove = async (videoId: string) => {
    try {
      await removeFromPlaylist.mutateAsync({ playlistId: id!, videoId });
      toast.success('Removed from playlist');
    } catch {
      toast.error('Failed to remove');
    }
  };

  if (isLoading) return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="h-12 bg-dark-700 rounded-xl animate-pulse mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-video bg-dark-700 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  if (!playlist) return <div className="p-6 text-center text-gray-400">Playlist not found</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/playlists" className="text-gray-400 hover:text-white transition-colors">
          <List size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">{playlist.name}</h1>
        <span className="text-sm text-gray-400">· {playlist.items?.length} videos</span>
      </div>

      {playlist.items?.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>No videos in this playlist yet.</p>
          <Link to="/" className="text-moon-400 hover:text-moon-300 text-sm mt-2 inline-block">Browse videos →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {playlist.items?.map((item) => item.video && (
            <div key={item.id} className="relative group">
              <VideoCard video={item.video} />
              <button
                onClick={() => handleRemove(item.videoId)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
