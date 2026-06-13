import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlaylists, useCreatePlaylist, useDeletePlaylist } from '../hooks/usePlaylists';
import toast from 'react-hot-toast';
import { Plus, Trash2, List } from 'lucide-react';

export default function Playlists() {
  const { data: playlists, isLoading } = usePlaylists();
  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createPlaylist.mutateAsync(newName.trim());
      setNewName('');
      setCreating(false);
      toast.success('Playlist created!');
    } catch {
      toast.error('Failed to create playlist');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deletePlaylist.mutateAsync(id);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <List size={22} className="text-moon-400" /> My Playlists
        </h1>
        <button
          onClick={() => setCreating(!creating)}
          className="flex items-center gap-2 px-4 py-2 bg-moon-600 hover:bg-moon-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Playlist
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-dark-800 border border-dark-600 rounded-xl flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Playlist name"
            autoFocus
            className="flex-1 px-4 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-moon-500"
          />
          <button type="submit" disabled={createPlaylist.isPending} className="px-4 py-2 bg-moon-600 hover:bg-moon-500 text-white rounded-lg text-sm font-medium">
            Create
          </button>
          <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-dark-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : playlists?.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <List size={40} className="mx-auto mb-3 opacity-30" />
          <p>No playlists yet. Create one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {playlists?.map((pl) => (
            <div key={pl.id} className="flex items-center justify-between p-4 bg-dark-800 border border-dark-600 rounded-xl hover:border-dark-500 transition-colors">
              <Link to={`/playlists/${pl.id}`} className="flex-1">
                <h3 className="font-semibold text-white hover:text-moon-300 transition-colors">{pl.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{pl.items?.length ?? 0} videos · {new Date(pl.createdAt).toLocaleDateString()}</p>
              </Link>
              <button
                onClick={() => handleDelete(pl.id, pl.name)}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
