import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, TrendingUp, Clock, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VideoCard } from "@/components/VideoCard";
import { ArtistCard } from "@/components/ArtistCard";
import { useState } from "react";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — Moonirat" },
      { name: "description", content: "Discover trending music videos and artists on Moonirat." },
    ],
  }),
  component: DiscoverPage,
});

// Demo data for MVP
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
];

const featuredArtists = [
  { slug: "luna-echo", name: "Luna Echo", profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face", verified: true, followerCount: 45000 },
  { slug: "cyber-wave", name: "Cyber Wave", profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", verified: true, followerCount: 32000 },
  { slug: "tidal-flow", name: "Tidal Flow", profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face", verified: false, followerCount: 18000 },
  { slug: "sunset-collective", name: "Sunset Collective", profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face", verified: true, followerCount: 67000 },
  { slug: "voltage", name: "Voltage", profileImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face", verified: false, followerCount: 12000 },
];

const genres = ["All", "Pop", "Hip Hop", "Electronic", "R&B", "Rock", "Indie", "Jazz"];

function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");

  return (
    <div className="min-h-[100dvh] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b-0 px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">Discover</h1>
        <div className="mt-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search artists, videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-glass border-glass-border h-10"
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-8">
        {/* Genre Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeGenre === genre
                  ? "bg-neon-purple text-white"
                  : "bg-glass text-muted-foreground hover:text-foreground border border-glass-border"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Trending Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-neon-purple" />
            <h2 className="text-lg font-bold text-foreground">Trending Now</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {trendingVideos.map((video) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        </section>

        {/* New Releases */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-neon-blue" />
            <h2 className="text-lg font-bold text-foreground">New Releases</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {newReleases.map((video) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        </section>

        {/* Featured Artists */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-neon-purple" />
            <h2 className="text-lg font-bold text-foreground">Featured Artists</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {featuredArtists.map((artist) => (
              <ArtistCard key={artist.slug} {...artist} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
