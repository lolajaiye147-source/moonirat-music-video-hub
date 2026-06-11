import { createFileRoute, Link } from "@tanstack/react-router";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { BarChart3, Upload, Users, Eye, Music } from "lucide-react";

export const Route = createFileRoute("/_authenticated/artist-dashboard")({
  head: () => ({
    meta: [
      { title: "Artist Dashboard — Moonirat" },
      { name: "description", content: "Manage your artist profile and videos on Moonirat." },
    ],
  }),
  component: ArtistDashboardPage,
});

const myVideos = [
  { id: "1", title: "Midnight Dreams", artistName: "Luna Echo", thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=360&fit=crop", duration: 215, viewCount: 125000 },
  { id: "8", title: "Starfall", artistName: "Luna Echo", thumbnailUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=640&h=360&fit=crop", duration: 189, viewCount: 45000 },
];

function ArtistDashboardPage() {
  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Artist Dashboard</h1>

        {/* Create Artist Profile CTA */}
        <div className="mt-4 rounded-xl bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 p-4 border border-glass-border">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-purple/20">
              <Music className="h-5 w-5 text-neon-purple" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Become an Artist</h3>
              <p className="text-xs text-muted-foreground mt-1">Create your artist profile to upload videos and reach fans worldwide.</p>
              <Button size="sm" className="mt-2 bg-neon-purple hover:bg-neon-purple/90 text-xs h-8">
                Create Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-glass p-4 border border-glass-border">
            <Eye className="h-5 w-5 text-neon-blue" />
            <p className="mt-2 text-2xl font-bold text-foreground">170K</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </div>
          <div className="rounded-xl bg-glass p-4 border border-glass-border">
            <Users className="h-5 w-5 text-neon-purple" />
            <p className="mt-2 text-2xl font-bold text-foreground">45K</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="rounded-xl bg-glass p-4 border border-glass-border">
            <Music className="h-5 w-5 text-neon-blue" />
            <p className="mt-2 text-2xl font-bold text-foreground">12</p>
            <p className="text-xs text-muted-foreground">Videos</p>
          </div>
          <div className="rounded-xl bg-glass p-4 border border-glass-border">
            <BarChart3 className="h-5 w-5 text-neon-purple" />
            <p className="mt-2 text-2xl font-bold text-foreground">+12%</p>
            <p className="text-xs text-muted-foreground">Growth</p>
          </div>
        </div>

        {/* My Videos */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">My Videos</h2>
            <Link to="/_authenticated/upload">
              <Button size="sm" className="bg-neon-purple hover:bg-neon-purple/90">
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {myVideos.map((video) => (
              <div key={video.id} className="flex gap-3 group">
                <Link to="/videos/$id" params={{ id: video.id }} className="relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden video-card">
                  <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
                  <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-xs text-white">
                    {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
                  </div>
                </Link>
                <div className="flex-1 py-1">
                  <Link to="/videos/$id" params={{ id: video.id }}>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-neon-purple">{video.title}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{video.viewCount.toLocaleString()} views</p>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs border-glass-border bg-glass">Edit</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs border-glass-border bg-glass text-destructive hover:bg-destructive/10">Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
