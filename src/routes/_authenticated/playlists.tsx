import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ListMusic, Play, Plus, Trash2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/playlists")({
  head: () => ({
    meta: [
      { title: "Library — Moonirat" },
      { name: "description", content: "Your playlists and saved videos on Moonirat." },
    ],
  }),
  component: PlaylistsPage,
});

// Demo playlists
const demoPlaylists = [
  {
    id: "1",
    name: "Late Night Vibes",
    description: "Chill electronic tracks for midnight sessions",
    videoCount: 12,
    isPublic: false,
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
  },
  {
    id: "2",
    name: "Workout Energy",
    description: "High BPM tracks to keep you moving",
    videoCount: 8,
    isPublic: true,
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
  },
  {
    id: "3",
    name: "Discover Weekly",
    description: "New finds from this week",
    videoCount: 5,
    isPublic: false,
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
  },
];

function PlaylistsPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState(demoPlaylists);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"playlists" | "favorites">("playlists");

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast.error("Playlist name is required");
      return;
    }
    const newPlaylist = {
      id: String(playlists.length + 1),
      name: newPlaylistName,
      description: "",
      videoCount: 0,
      isPublic: false,
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    };
    setPlaylists([newPlaylist, ...playlists]);
    setNewPlaylistName("");
    setIsDialogOpen(false);
    toast.success("Playlist created!");
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists(playlists.filter((p) => p.id !== id));
    toast.success("Playlist deleted");
  };

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Your Library</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-neon-purple hover:bg-neon-purple/90">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="bg-glass border-glass-border"
                />
                <Button onClick={handleCreatePlaylist} className="w-full bg-neon-purple hover:bg-neon-purple/90">
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 rounded-lg bg-glass p-1">
          <button
            onClick={() => setActiveTab("playlists")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              activeTab === "playlists" ? "bg-neon-purple text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              activeTab === "favorites" ? "bg-neon-purple text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Favorites
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3">
          {activeTab === "playlists" ? (
            playlists.length > 0 ? (
              playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="flex items-center gap-3 rounded-xl bg-glass p-3 border border-glass-border group"
                >
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                    <img src={playlist.coverUrl} alt={playlist.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-5 w-5 text-white" fill="white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{playlist.name}</h3>
                    <p className="text-xs text-muted-foreground">{playlist.videoCount} videos</p>
                  </div>
                  <button
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <ListMusic className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No playlists yet</p>
                <p className="text-xs text-muted-foreground">Create your first playlist to get started</p>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <ListMusic className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">No favorites yet</p>
              <p className="text-xs text-muted-foreground">Heart videos you love to save them here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
