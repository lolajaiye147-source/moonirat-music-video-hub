import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Music, CheckCircle, XCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Moonirat" },
      { name: "description", content: "Moonirat admin dashboard." },
    ],
  }),
  component: AdminPage,
});

// Demo data
const pendingArtists = [
  { id: "1", name: "Neon Pulse", email: "neon@example.com", requestedAt: "2024-12-20", genre: "Electronic" },
  { id: "2", name: "Rhythm Collective", email: "rhythm@example.com", requestedAt: "2024-12-19", genre: "Hip Hop" },
];

const allUsers = [
  { id: "1", username: "luna_echo", email: "luna@example.com", role: "artist", joinedAt: "2023-06-15" },
  { id: "2", username: "cyber_wave", email: "cyber@example.com", role: "artist", joinedAt: "2023-08-22" },
  { id: "3", username: "music_fan", email: "fan@example.com", role: "user", joinedAt: "2024-01-10" },
];

const allVideos = [
  { id: "1", title: "Midnight Dreams", artist: "Luna Echo", status: "public", reports: 0 },
  { id: "2", title: "Neon Lights", artist: "Cyber Wave", status: "public", reports: 1 },
];

function AdminPage() {
  const [artists, setArtists] = useState(pendingArtists);
  const [users] = useState(allUsers);
  const [videos] = useState(allVideos);

  const handleVerify = (id: string) => {
    setArtists(artists.filter((a) => a.id !== id));
    toast.success("Artist verified successfully");
  };

  const handleReject = (id: string) => {
    setArtists(artists.filter((a) => a.id !== id));
    toast.success("Artist application rejected");
  };

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-6 w-6 text-neon-blue" />
          <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-glass p-4 border border-glass-border">
            <Users className="h-5 w-5 text-neon-purple" />
            <p className="mt-2 text-2xl font-bold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          <div className="rounded-xl bg-glass p-4 border border-glass-border">
            <Music className="h-5 w-5 text-neon-blue" />
            <p className="mt-2 text-2xl font-bold text-foreground">{videos.length}</p>
            <p className="text-xs text-muted-foreground">Total Videos</p>
          </div>
        </div>

        <Tabs defaultValue="artists" className="w-full">
          <TabsList className="w-full bg-glass border border-glass-border">
            <TabsTrigger value="artists" className="flex-1 data-[state=active]:bg-neon-purple data-[state=active]:text-white">Artists</TabsTrigger>
            <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-neon-purple data-[state=active]:text-white">Users</TabsTrigger>
            <TabsTrigger value="videos" className="flex-1 data-[state=active]:bg-neon-purple data-[state=active]:text-white">Videos</TabsTrigger>
          </TabsList>

          <TabsContent value="artists" className="mt-4 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Pending Verification ({artists.length})</h2>
            {artists.map((artist) => (
              <div key={artist.id} className="rounded-xl bg-glass p-4 border border-glass-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{artist.name}</h3>
                    <p className="text-xs text-muted-foreground">{artist.email}</p>
                    <p className="text-xs text-muted-foreground">Genre: {artist.genre} • Requested: {artist.requestedAt}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleVerify(artist.id)} className="bg-neon-purple hover:bg-neon-purple/90 h-8">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Verify
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(artist.id)} className="border-glass-border bg-glass h-8 text-destructive hover:bg-destructive/10">
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {artists.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-8 w-8 text-neon-purple/50" />
                <p className="mt-2 text-sm text-muted-foreground">No pending artist applications</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-xl bg-glass p-4 border border-glass-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">@{user.username}</h3>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === "artist" ? "default" : "secondary"} className={user.role === "artist" ? "bg-neon-purple" : ""}>
                    {user.role}
                  </Badge>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-glass-border bg-glass">Manage</Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="videos" className="mt-4 space-y-3">
            {videos.map((video) => (
              <div key={video.id} className="rounded-xl bg-glass p-4 border border-glass-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{video.title}</h3>
                  <p className="text-xs text-muted-foreground">{video.artist}</p>
                </div>
                <div className="flex items-center gap-2">
                  {video.reports > 0 && (
                    <Badge variant="destructive" className="text-xs">{video.reports} report</Badge>
                  )}
                  <Button size="sm" variant="outline" className="h-7 text-xs border-glass-border bg-glass text-destructive hover:bg-destructive/10">
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
