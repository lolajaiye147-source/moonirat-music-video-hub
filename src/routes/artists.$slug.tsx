import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/VideoCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck, Users, Music, Calendar, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/artists/$slug")({
  head: () => ({
    meta: [
      { title: "Artist — Moonirat" },
      { name: "description", content: "Discover artist profiles on Moonirat." },
    ],
  }),
  component: ArtistPage,
});

const artistVideos = [
  { id: "1", title: "Midnight Dreams", artistName: "Luna Echo", thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=360&fit=crop", duration: 215, viewCount: 125000 },
  { id: "8", title: "Starfall", artistName: "Luna Echo", thumbnailUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=640&h=360&fit=crop", duration: 189, viewCount: 45000 },
  { id: "9", title: "Lunar Eclipse", artistName: "Luna Echo", thumbnailUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=640&h=360&fit=crop", duration: 267, viewCount: 32000 },
];

function ArtistPage() {
  const { slug } = Route.useParams();
  const [isFollowing, setIsFollowing] = useState(false);

  // Demo artist data
  const artist = {
    name: "Luna Echo",
    slug,
    bio: "Luna Echo is an electronic music producer and visual artist known for creating immersive audiovisual experiences. Based in Berlin, their work blends ambient textures with pulsating electronic beats.",
    profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
    coverImageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1280&h=400&fit=crop",
    verified: true,
    followerCount: 45000,
    videoCount: 12,
    joinedDate: "2023-06-15",
  };

  return (
    <div className="min-h-[100dvh] pb-20">
      {/* Cover Image */}
      <div className="relative h-40 w-full">
        <img src={artist.coverImageUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Profile Info */}
      <div className="px-4 -mt-12 relative">
        <Avatar className="h-24 w-24 border-4 border-background">
          <AvatarImage src={artist.profileImageUrl} alt={artist.name} className="object-cover" />
          <AvatarFallback className="bg-neon-purple/20 text-neon-purple text-2xl font-bold">
            {artist.name[0]}
          </AvatarFallback>
        </Avatar>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{artist.name}</h1>
            {artist.verified && (
              <BadgeCheck className="h-5 w-5 text-neon-blue" />
            )}
          </div>

          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {artist.followerCount.toLocaleString()} followers
            </span>
            <span className="flex items-center gap-1">
              <Music className="h-4 w-4" />
              {artist.videoCount} videos
            </span>
          </div>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{artist.bio}</p>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                setIsFollowing(!isFollowing);
                toast.success(isFollowing ? "Unfollowed" : `Following ${artist.name}`);
              }}
              className={isFollowing ? "bg-glass border border-glass-border text-foreground hover:bg-glass/80" : "bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground"}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button variant="outline" size="icon" className="border-glass-border bg-glass" onClick={() => toast.success("Profile link copied")}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Videos Section */}
      <div className="mt-6 px-4">
        <h2 className="text-lg font-bold text-foreground mb-3">Videos</h2>
        <div className="space-y-3">
          {artistVideos.map((video) => (
            <div key={video.id} className="flex gap-3 group cursor-pointer">
              <Link to="/videos/$id" params={{ id: video.id }} className="relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden video-card">
                <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-xs text-white">
                  {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
                </div>
              </Link>
              <div className="flex-1 py-1">
                <Link to="/videos/$id" params={{ id: video.id }}>
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-neon-purple">{video.title}</h3>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">{video.viewCount.toLocaleString()} views</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
