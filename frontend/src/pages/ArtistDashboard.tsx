import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyArtistProfile, useCreateArtist } from '../hooks/useArtists';
import { useVideos, useDeleteVideo } from '../hooks/useVideos';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, Trash2, Upload, Music, CheckCircle, Users } from 'lucide-react';

export default function ArtistDashboard() {
  const { user } = useAuth();
  const { data: artist, isLoading: artistLoading, error: artistError } = useMyArtistProfile();
  const createArtist = useCreateArtist();
  const [form, setForm] = useState({ name: '', bio: '', profileImage: '' });
  const [creating, setCreating] = useState(false);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createArtist.mutateAsync(form);
      toast.success('Artist profile created!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create profile');
    } finally {
      setCreating(false);
    }
  };

  if (artistLoading) return <div className="p-6"><div className="h-40 bg-dark-700 rounded-2xl animate-pulse" /></div>;

  if (!artist) return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Create Artist Profile</h1>
      <p className="text-gray-400 mb-6">Set up your artist page to start uploading videos</p>
      <form onSubmit={handleCreateProfile} className="bg-dark-800 border border-dark-600 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Artist Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-white focus:outline-none focus:border-moon-500"
            placeholder="Your artist name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio (optional)</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-white focus:outline-none focus:border-moon-500 resize-none"
            placeholder="Tell fans about yourself..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Profile Image URL (optional)</label>
          <input value={form.profileImage} onChange={(e) => setForm({ ...form, profileImage: e.target.value })}
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-white focus:outline-none focus:border-moon-500"
            placeholder="https://..." />
        </div>
        <button type="submit" disabled={creating} className="w-full py-2.5 bg-moon-600 hover:bg-moon-500 text-white font-semibold rounded-lg">
          {creating ? 'Creating...' : 'Create Profile'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Artist info */}
      <div className="bg-dark-800 border border-dark-600 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-moon-600 to-purple-700 flex-shrink-0">
          {artist.profileImage ? (
            <img src={artist.profileImage} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">{artist.name.charAt(0)}</div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">{artist.name}</h2>
            {artist.verified && <CheckCircle size={16} className="text-moon-400" />}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Users size={13} /> {artist.followersCount.toLocaleString()} followers</span>
          </div>
        </div>
        <Link to="/upload" className="flex items-center gap-2 px-4 py-2.5 bg-moon-600 hover:bg-moon-500 text-white rounded-lg font-medium text-sm transition-colors">
          <Upload size={16} /> Upload Video
        </Link>
      </div>

      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Music size={18} className="text-moon-400" /> My Videos
      </h2>
      <MyVideosList artistId={artist.id} />
    </div>
  );
}

function MyVideosList({ artistId }: { artistId: string }) {
  const { data, isLoading } = useVideos(1, 50);
  const deleteVideo = useDeleteVideo();

  const myVideos = data?.videos.filter((v) => v.artistId === artistId) || [];

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteVideo.mutateAsync(id);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (isLoading) return <div className="h-32 bg-dark-700 rounded-xl animate-pulse" />;
  if (myVideos.length === 0) return (
    <div className="text-center py-12 text-gray-500">
      <p>No videos yet.</p>
      <Link to="/upload" className="text-moon-400 hover:text-moon-300 text-sm mt-1 inline-block">Upload your first →</Link>
    </div>
  );

  return (
    <div className="space-y-3">
      {myVideos.map((v) => (
        <div key={v.id} className="flex items-center gap-4 p-4 bg-dark-800 border border-dark-600 rounded-xl hover:border-dark-500 transition-colors">
          <div className="w-24 h-14 bg-dark-700 rounded-lg overflow-hidden flex-shrink-0">
            {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" /> :
              <div className="w-full h-full bg-gradient-to-br from-moon-900 to-dark-700" />}
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/videos/${v.id}`} className="font-medium text-white hover:text-moon-300 transition-colors line-clamp-1">{v.title}</Link>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
              <Eye size={12} /> {v.views.toLocaleString()} views
            </div>
          </div>
          <button onClick={() => handleDelete(v.id, v.title)} className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function toast(arg0: string) {
  throw new Error('Function not implemented.');
}
