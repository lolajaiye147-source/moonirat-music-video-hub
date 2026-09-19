import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, TrendingUp, Clock, Users, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VideoCard } from "@/components/VideoCard";
import { ArtistCard } from "@/components/ArtistCard";
import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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
const DISCOVERY_PAGE_SIZE = 12;

function DiscoverPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const genre = activeGenre === "All" ? undefined : activeGenre.toLowerCase();
  const trendingQuery = useInfiniteQuery({
    queryKey: ["discover", "trending", genre],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getPublicVideos({ genre, limit: DISCOVERY_PAGE_SIZE, offset: pageParam }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === DISCOVERY_PAGE_SIZE ? pages.length * DISCOVERY_PAGE_SIZE : undefined,
  });
  const releasesQuery = useInfiniteQuery({
    queryKey: ["discover", "new-releases", genre],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getNewReleases({ genre, limit: DISCOVERY_PAGE_SIZE, offset: pageParam }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === DISCOVERY_PAGE_SIZE ? pages.length * DISCOVERY_PAGE_SIZE : undefined,
  });
  const artistsQuery = useQuery({ queryKey: ["discover", "artists"], queryFn: () => getFeaturedArtists(12) });
  const hasError = trendingQuery.isError || releasesQuery.isError || artistsQuery.isError;

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="glass sticky top-0 z-40 border-b-0 px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">Discover</h1>
        <form
          className="relative mt-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (searchQuery.trim()) {
              void navigate({ to: "/search", search: { q: searchQuery.trim() } });
            }
          }}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search all artists and videos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-10 border-glass-border bg-glass pl-9" />
        </form>
      </div>
      <div className="space-y-8 px-4 py-4">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {genres.map((item) => <button key={item} onClick={() => setActiveGenre(item)} className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeGenre === item ? "bg-neon-purple text-white" : "border border-glass-border bg-glass text-muted-foreground hover:text-foreground"}`}>{item}</button>)}
        </div>
        {hasError && <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4" /> Some discovery data could not be loaded.</div>}
        <DiscoverySection title="Trending Now" icon={<TrendingUp className="h-5 w-5 text-neon-purple" />} videos={trendingQuery.data?.pages.flat() ?? []} isLoading={trendingQuery.isLoading} isError={trendingQuery.isError} hasMore={trendingQuery.hasNextPage} isLoadingMore={trendingQuery.isFetchingNextPage} onLoadMore={() => trendingQuery.fetchNextPage()} />
        <DiscoverySection title="New Releases" icon={<Clock className="h-5 w-5 text-neon-blue" />} videos={releasesQuery.data?.pages.flat() ?? []} isLoading={releasesQuery.isLoading} isError={releasesQuery.isError} hasMore={releasesQuery.hasNextPage} isLoadingMore={releasesQuery.isFetchingNextPage} onLoadMore={() => releasesQuery.fetchNextPage()} />
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
  hasMore,
  isLoadingMore,
  onLoadMore,
}: {
  title: string;
  icon: React.ReactNode;
  videos: VideoWithArtist[];
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">{icon}<h2 className="text-lg font-bold text-foreground">{title}</h2></div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading videos…</p> : isError ? <p className="text-sm text-destructive">This section could not be loaded.</p> : videos.length ? <><div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">{videos.map((video) => <VideoCard key={video.id} id={video.id} publicSlug={video.public_slug} title={video.title} artistName={video.artists?.name ?? "Unknown artist"} thumbnailUrl={video.thumbnail_url} duration={video.duration} viewCount={video.view_count} queueIds={videos.map((item) => item.id)} queueSource={`Discover ${title}`} />)}</div>{hasMore && <button type="button" onClick={onLoadMore} disabled={isLoadingMore} className="mt-3 text-sm font-medium text-neon-purple disabled:opacity-50">{isLoadingMore ? "Loading more…" : "Load more"}</button>}</> : <p className="text-sm text-muted-foreground">No videos match this selection yet.</p>}
    </section>
  );
}