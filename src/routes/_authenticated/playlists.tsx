import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ListMusic, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { createPlaylist, deletePlaylist, getUserPlaylists } from "@/lib/moonirat-data";

export const Route = createFileRoute("/_authenticated/playlists")({
  head: () => ({
    meta: [
      { title: "Library — Moonirat" },
      { name: "description", content: "Your playlists and saved videos on Moonirat." },
    ],
  }),
  component: PlaylistsPage,
});

function PlaylistsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"playlists" | "favorites">("playlists");
  const playlistsQuery = useQuery({
    queryKey: ["playlists", user?.id],
    queryFn: () => getUserPlaylists(user!.id),
    enabled: Boolean(user?.id),
  });
  const createMutation = useMutation({
    mutationFn: () => createPlaylist(user!.id, newPlaylistName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["playlists", user?.id] });
      setNewPlaylistName("");
      setIsDialogOpen(false);
      toast.success("Playlist created!");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Playlist could not be created"),
  });
  const deleteMutation = useMutation({
    mutationFn: (playlistId: string) => deletePlaylist(user!.id, playlistId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["playlists", user?.id] });
      toast.success("Playlist deleted");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Playlist could not be deleted"),
  });

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast.error("Playlist name is required");
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Your Library</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-neon-purple hover:bg-neon-purple/90">
                <Plus className="mr-1 h-4 w-4" /> New
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-card sm:max-w-md">
              <DialogHeader><DialogTitle>Create Playlist</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Input placeholder="Playlist name" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} className="border-glass-border bg-glass" />
                <Button onClick={handleCreatePlaylist} disabled={createMutation.isPending} className="w-full bg-neon-purple hover:bg-neon-purple/90">
                  {createMutation.isPending ? "Creating…" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-4 flex gap-1 rounded-lg bg-glass p-1">
          {(["playlists", "favorites"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 rounded-md py-2 text-sm font-medium capitalize transition-colors ${activeTab === tab ? "bg-neon-purple text-white" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {activeTab === "favorites" ? (
            <EmptyState title="Favorites are not available yet" message="The current Moonirat schema has no favorites table, so this view will not pretend to save likes locally." />
          ) : playlistsQuery.isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Loading your playlists…</p>
          ) : playlistsQuery.isError ? (
            <EmptyState title="Playlists could not be loaded" message="Try again after checking your connection." error />
          ) : playlistsQuery.data?.length ? (
            playlistsQuery.data.map((playlist) => (
              <div key={playlist.id} className="group flex items-center gap-3 rounded-xl border border-glass-border bg-glass p-3">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-deep-navy">
                  {playlist.playlist_videos[0]?.videos?.thumbnail_url ? (
                    <img src={playlist.playlist_videos[0].videos.thumbnail_url} alt={playlist.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><ListMusic className="h-6 w-6 text-neon-purple/60" /></div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"><Play className="h-5 w-5 text-white" fill="white" /></div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-foreground">{playlist.name}</h3>
                  <p className="text-xs text-muted-foreground">{playlist.playlist_videos.length} videos</p>
                </div>
                <button type="button" onClick={() => deleteMutation.mutate(playlist.id)} disabled={deleteMutation.isPending} className="p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50" aria-label={`Delete ${playlist.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <EmptyState title="No playlists yet" message="Create your first playlist to get started." />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, message, error = false }: { title: string; message: string; error?: boolean }) {
  return (
    <div className="py-12 text-center">
      <ListMusic className={`mx-auto h-12 w-12 ${error ? "text-destructive/60" : "text-muted-foreground/50"}`} />
      <p className="mt-4 text-sm text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}