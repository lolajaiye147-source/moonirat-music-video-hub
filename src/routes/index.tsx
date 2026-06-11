import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/VideoCard";
import { ArtistCard } from "@/components/ArtistCard";
import { TrendingUp, Flame, Star, ChevronRight, Play } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moonirat — The Home of Music Videos" },
      { name: "description", content: "Discover music videos from emerging artists. Stream, follow, and create playlists on Moonirat." },
      { property: "og:title", content: "Moonirat — The Home of Music Videos" },
      { property: "og:description", content: "Discover music videos from emerging artists. Stream, follow, and create playlists on Moonirat." },
    ],
  }),
  component: HomePage,
});

const featuredVideo = {
  id: "featured-1",
  title: "Midnight Dreams",
  artistName: "Luna Echo",
  thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1280&h=720&fit=crop",
  duration: 215,
  viewCount: 125000,
};

const trendingVideos = [
  { id: "1", title: "Midnight Dreams", artistName: "Luna Echo", thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=360&fit=crop", duration: 215, viewCount: 125000 },
  { id: "2", title: "Neon Lights", artistName: "Cyber Wave", thumbnailUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=360&fit=crop", duration: 198, viewCount: 89000 },
  { id: "3", title: "Ocean Breeze", artistName: "Tidal Flow", thumbnailUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&h=360&fit=crop", duration: 245, viewCount: 67000 },
  { id: "4", title: "Golden Hour", artistName: "Sunset Collective", thumbnailUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=640&h=360&fit=crop", duration: 312, viewCount: 54000 },
];

const newReleases = [
  { id: "5", title: "Electric Soul", artistName: "Voltage", thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=640&h=360&fit=crop", duration: 180, viewCount: 12000 },
  { id: "6", title: "Starlight", artistName: "Astral Beats", thumbnailUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=640&h=360&fit=crop", duration: 234, viewCount: 8900 },
  { id: "7", title: "Urban Pulse", artistName: "Metro Sound", thumbnailUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=640&h=360&fit=crop", duration: 201, viewCount: 7600 },
  { id: "8", title: "Starfall", artistName: "Luna Echo", thumbnailUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=640&h=360&fit=crop", duration: 189, viewCount: 45000 },
];

const featuredArtists = [
  { slug: "luna-echo", name: "Luna Echo", profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face", verified: true, followerCount: 45000 },
  { slug: "cyber-wave", name: "Cyber Wave", profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", verified: true, followerCount: 32000 },
  { slug: "tidal-flow", name: "Tidal Flow", profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face", verified: false, followerCount: 18000 },
  { slug: "sunset-collective", name: "Sunset Collective", profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face", verified: true, followerCount: 67000 },
  { slug: "voltage", name: "Voltage", profileImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face", verified: false, followerCount: 12000 },
];

function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[100dvh] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-purple/20">
            <TrendingUp className="h-4 w-4 text-neon-purple" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-gradient">Moonirat</span>
          </h1>
        </div>
        {!user && (
          <Link to="/auth">
            <Button size="sm" className="bg-neon-purple hover:bg-neon-purple/90 text-xs h-8">
              Sign In
            </Button>
          </Link>
        )}
      </div>

      {/* Hero Featured Video */}
      <div className="relative mx-4 mt-2 aspect-video overflow-hidden rounded-2xl">
        <img
          src={featuredVideo.thumbnailUrl}
          alt={featuredVideo.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-neon-purple" />
            <span className="text-xs font-medium text-neon-purple">Featured</span>
          </div>
          <h2 className="text-xl font-bold text-white">{featuredVideo.title}</h2>
          <p className="text-sm text-white/80">{featuredVideo.artistName}</p>
          <Link to="/videos/$id" params={{ id: featuredVideo.id }}>
            <Button className="mt-3 bg-neon-purple hover:bg-neon-purple/90 text-white">
              <Play className="h-4 w-4 mr-2" fill="white" />
              Watch Now
            </Button>
          </Link>
        </div>
      </div>

      <div className="px-4 py-4 space-y-8">
        {/* Trending Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-neon-purple" />
              <h2 className="text-lg font-bold text-foreground">Trending</h2>
            </div>
            <Link to="/discover" className="flex items-center text-xs font-medium text-neon-purple hover:text-neon-purple/80">
              See All <ChevronRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {trendingVideos.map((video) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        </section>

        {/* Featured Artists */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-neon-blue" />
              <h2 className="text-lg font-bold text-foreground">Featured Artists</h2>
            </div>
            <Link to="/discover" className="flex items-center text-xs font-medium text-neon-purple hover:text-neon-purple/80">
              See All <ChevronRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {featuredArtists.map((artist) => (
              <div key={artist.slug} className="flex-shrink-0">
                <ArtistCard {...artist} />
              </div>
            ))}
          </div>
        </section>

        {/* New Releases */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-neon-blue" />
              <h2 className="text-lg font-bold text-foreground">New Releases</h2>
            </div>
            <Link to="/discover" className="flex items-center text-xs font-medium text-neon-purple hover:text-neon-purple/80">
              See All <ChevronRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {newReleases.map((video) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        </section>

        {/* Tagline */}
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground italic">
            "Moonirat — The Home of Music Videos"
          </p>
        </div>
      </div>
    </div>
  );
}
