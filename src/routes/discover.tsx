import { createFileRoute } from "@tanstack/react-router";
import { Search, TrendingUp, Clock, Users, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VideoCard } from "@/components/VideoCard";
import { ArtistCard } from "@/components/ArtistCard";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFeaturedArtists, getNewReleases, getPublicVideos, type VideoWithArtist } from "@/lib/moonirat-data";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — Moonirat" },
      { name: "description", content: "Discover trending music videos and artists on Moonirat." },
    ],
  }),
  component: DiscoverPage,
});

const genres = ["All", "Pop", "Hip Hop", "Electronic", "R&B", "Rock", "Indie", "Jazz", "Afrobeats", "Amapiano"];

function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const genre = activeGenre === "All" ? undefined : activeGenre.toLowerCase();
  const trendingQuery = useQuery({ queryKey: ["discover", "trending", genre], queryFn: () => getPublicVideos({ genre, limit: 12 }) });
  const releasesQuery = useQuery({ queryKey: ["discover", "new-releases", genre], queryFn: () => getNewReleases({ genre, limit: 12 }) });
  const artistsQuery = useQuery({ queryKey: ["discover", "artists"], queryFn: () => getFeaturedArtists(12) });
  const hasError = trendingQuery.isError || releasesQuery.isError || artistsQuery.isError;

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="glass sticky top-0 z-40 border-b-0 px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">Discover</h1>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search artists, videos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-10 border-glass-border bg-glass pl-9" />
        </div>
      </div>
      <div className="space-y-8 px-4 py-4">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {genres.map((item) => <button key={item} onClick={() => setActiveGenre(item)} className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeGenre === item ? "bg-neon-purple text-white" : "border border-glass-border bg-glass text-muted-foreground hover:text-foreground"}`}>{item}</button>)}
        </div>
        {hasError && <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4" /> Some discovery data could not be loaded.</div>}
        <DiscoverySection title="Trending Now" icon={<TrendingUp className="h-5 w-5 text-neon-purple" />} videos={trendingQuery.data ?? []} isLoading={trendingQuery.isLoading} isError={trendingQuery.isError} searchQuery={searchQuery} />
        <DiscoverySection title="New Releases" icon={<Clock className="h-5 w-5 text-neon-blue" />} videos={releasesQuery.data ?? []} isLoading={releasesQuery.isLoading} isError={releasesQuery.isError} searchQuery={searchQuery} />
        <section>
          <div className="mb-3 flex items-center gap-2"><Users className="h-5 w-5 text-neon-purple" /><h2 className="text-lg font-bold text-foreground">Featured Artists</h2></div>
          {artistsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading artists…</p> : artistsQuery.data?.length ? <div className="grid grid-cols-3 gap-3">{artistsQuery.data.map((artist) => <ArtistCard key={artist.id} slug={artist.slug} name={artist.name} profileImageUrl={artist.profile_image_url} verified={artist.verified} />)}</div> : <p className="text-sm text-muted-foreground">No featured artists yet.</p>}
        </section>
      </div>
    </div>
  );
}

function DiscoverySection({
  title,
  icon,
  videos,
  isLoading,
  isError,
  searchQuery,
}: {
  title: string;
  icon: React.ReactNode;
  videos: VideoWithArtist[];
  isLoading: boolean;
  isError: boolean;
  searchQuery: string;
}) {
  const filteredVideos = videos.filter((video) => !searchQuery.trim() || video.title.toLowerCase().includes(searchQuery.toLowerCase()) || video.artists?.name.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">{icon}<h2 className="text-lg font-bold text-foreground">{title}</h2></div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading videos…</p> : isError ? <p className="text-sm text-destructive">This section could not be loaded.</p> : filteredVideos.length ? <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">{filteredVideos.map((video) => <VideoCard key={video.id} id={video.id} title={video.title} artistName={video.artists?.name ?? "Unknown artist"} thumbnailUrl={video.thumbnail_url} duration={video.duration} viewCount={video.view_count} />)}</div> : <p className="text-sm text-muted-foreground">No videos match this selection yet.</p>}
    </section>
  );
}