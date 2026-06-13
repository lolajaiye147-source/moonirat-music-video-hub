import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { useVideo } from '../hooks/useVideos';
import { useFollow, useUnfollow, useFollowedArtists } from '../hooks/useFollows';
import { usePlaylists, useAddToPlaylist } from '../hooks/usePlaylists';
import { useAuth } from '../context/AuthContext';
import { videosApi } from '../api/videos';
import { useEffect, useState } from 'react';
import { Eye, CheckCircle, UserPlus, UserCheck, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: video, isLoading } = useVideo(id!);
  const { isAuthenticated } = useAuth();
  const { data: followedData } = useFollowedArtists();
  const follow = useFollow();
  const unfollow = useUnfollow();
  const { data: playlists } = usePlaylists();
  const addToPlaylist = useAddToPlaylist();
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  useEffect(() => {
    if (id) videosApi.incrementView(id).catch(() => {});
  }, [id]);

  if (isLoading) return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="aspect-video bg-dark-700 rounded-2xl animate-pulse mb-4" />
    </div>
  );
  if (!video) return <div className="p-6 text-center text-gray-400">Video not found</div>;

  const isFollowing = followedData?.artists.some((a) => a.id === video.artist?.id);

  const handleFollow = async () => {
    if (!video.artist) return;
    try {
      if (isFollowing) {
        await unfollow.mutateAsync(video.artist.id);
        toast.success('Unfollowed');
      } else {
        await follow.mutateAsync(video.artist.id);
        toast.success('Following!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      await addToPlaylist.mutateAsync({ playlistId, videoId: video.id });
      toast.success('Added to playlist!');
      setShowPlaylistMenu(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="aspect-video bg-dark-900 rounded-2xl overflow-hidden mb-5">
        <ReactPlayer url={video.videoUrl} width="100%" height="100%" controls playing={false} />
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{video.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Eye size={14} /> {video.views.toLocaleString()} views</span>
            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
          </div>
          {video.description && (
            <p className="mt-4 text-gray-300 text-sm leading-relaxed">{video.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dark-500 hover:bg-dark-700 text-gray-300 text-sm transition-colors"
              >
                <Plus size={16} /> Save
              </button>
              {showPlaylistMenu && playlists && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-dark-700 border border-dark-500 rounded-xl shadow-xl z-10 py-1">
                  {playlists.length === 0 ? (
                    <Link to="/playlists" className="block px-4 py-2 text-sm text-gray-400">Create a playlist first</Link>
                  ) : playlists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => handleAddToPlaylist(pl.id)}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-dark-600 transition-colors"
                    >
                      {pl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {video.artist && (
        <div className="mt-6 p-4 bg-dark-800 border border-dark-600 rounded-xl flex items-center justify-between">
          <Link to={`/artists/${video.artist.id}`} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-moon-600 to-purple-700">
              {video.artist.profileImage ? (
                <img src={video.artist.profileImage} alt={video.artist.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white">
                  {video.artist.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-white group-hover:text-moon-300 transition-colors">{video.artist.name}</span>
                {video.artist.verified && <CheckCircle size={14} className="text-moon-400" />}
              </div>
              <span className="text-xs text-gray-400">Artist</span>
            </div>
          </Link>
          {isAuthenticated && (
            <button
              onClick={handleFollow}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isFollowing ? 'bg-dark-600 text-gray-300 hover:bg-red-900/30 hover:text-red-400' : 'bg-moon-600 hover:bg-moon-500 text-white'
              }`}
            >
              {isFollowing ? <><UserCheck size={15} /> Following</> : <><UserPlus size={15} /> Follow</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
