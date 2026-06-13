import { useParams } from 'react-router-dom';
import { useArtist, useArtistVideos } from '../hooks/useArtists';
import { useFollow, useUnfollow, useFollowedArtists } from '../hooks/useFollows';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import { CheckCircle, Users, UserPlus, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: artist, isLoading } = useArtist(id!);
  const { data: videosData } = useArtistVideos(id!);
  const { isAuthenticated } = useAuth();
  const { data: followedData } = useFollowedArtists();
  const follow = useFollow();
  const unfollow = useUnfollow();

  if (isLoading) return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="h-40 bg-dark-700 rounded-2xl animate-pulse" />
    </div>
  );
  if (!artist) return <div className="p-6 text-center text-gray-400">Artist not found</div>;

  const isFollowing = followedData?.artists.some((a) => a.id === artist.id);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollow.mutateAsync(artist.id);
        toast.success('Unfollowed');
      } else {
        await follow.mutateAsync(artist.id);
        toast.success('Following!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-moon-900 to-dark-800 border border-dark-600 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
          <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-moon-600 flex-shrink-0">
            {artist.profileImage ? (
              <img src={artist.profileImage} alt={artist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-moon-500 to-purple-700 flex items-center justify-center text-4xl font-bold text-white">
                {artist.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">{artist.name}</h1>
              {artist.verified && <CheckCircle size={20} className="text-moon-400" />}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-gray-400 mb-3">
              <Users size={14} />
              <span>{artist.followersCount.toLocaleString()} followers</span>
            </div>
            {artist.bio && <p className="text-gray-300 text-sm max-w-lg">{artist.bio}</p>}
          </div>
          {isAuthenticated && (
            <button
              onClick={handleFollow}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                isFollowing ? 'bg-dark-600 text-gray-300 hover:bg-red-900/30 hover:text-red-400' : 'bg-moon-600 hover:bg-moon-500 text-white'
              }`}
            >
              {isFollowing ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
            </button>
          )}
        </div>
      </div>

      {/* Videos */}
      <h2 className="text-lg font-bold text-white mb-4">Videos</h2>
      {videosData?.videos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No videos yet</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videosData?.videos.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      )}
    </div>
  );
}
