import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, X, Play, BadgeCheck, Users, Music2, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — Moonirat" },
      { name: "description", content: "Search artists and music videos on Moonirat." },
    ],
  }),
  component: SearchPage,
});

type SearchTab = "all" | "videos" | "artists";

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatViews(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return `${count}`;
}

function formatFollowers(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return `${count}`;
}

function trackSearchEvent(type: "query" | "artist_click" | "video_click", data: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.info("[moonirat:search]", type, data);
  }
}

async function searchArtists(query: string) {
  const { data, error } = await supabase
    .from("artists")
    .select("id, name, slug, profile_image_url, verified, bio")
    .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
    .order("verified", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

async function searchVideos(query: string) {
  const { data, error } = await supabase
    .from("videos")
    .select("id, title, thumbnail_url, duration, view_count, artist_id, artists(name, slug, profile_image_url, verified)")
    .ilike("title", `%${query}%`)
    .eq("is_public", true)
    .order("view_count", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    title: string;
    thumbnail_url: string | null;
    duration: number | null;
    view_count: number;
    artist_id: string;
    artists: { name: string; slug: string; profile_image_url: string | null; verified: boolean } | null;
  }>;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback(
    (v: T) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setDebounced(v), delay);
    },
    [delay],
  );

  if (value !== debounced) update(value);
  return debounced;
}

function VideoResultCard({
  video,
}: {
  video: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    duration: number | null;
    view_count: number;
    artists: { name: string; slug: string; profile_image_url: string | null; verified: boolean } | null;
  };
}) {
  return (
    <Link
      to="/videos/$id"
      params={{ id: video.id }}
      className="flex gap-3 rounded-xl p-2 transition-colors hover:bg-glass group"
      onClick={() => trackSearchEvent("video_click", { id: video.id, title: video.title })}
    >
      <div className="relative flex-shrink-0 w-36 sm:w-44 aspect-video rounded-lg overflow-hidden bg-deep-navy">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="h-8 w-8 text-neon-purple opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neon-purple/80 backdrop-blur-sm">
            <Play className="h-4 w-4 text-white ml-0.5" fill="white" />
          </div>
        </div>
        {video.duration && (
          <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center gap-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-neon-purple transition-colors">
          {video.title}
        </h3>
        {video.artists && (
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground truncate">{video.artists.name}</p>
            {video.artists.verified && <BadgeCheck className="h-3 w-3 text-neon-blue flex-shrink-0" />}
          </div>
        )}
        {video.view_count > 0 && (
          <p className="text-xs text-muted-foreground">{formatViews(video.view_count)} views</p>
        )}
      </div>
    </Link>
  );
}

function ArtistResultRow({
  artist,
}: {
  artist: { id: string; name: string; slug: string; profile_image_url: string | null; verified: boolean; bio: string | null };
}) {
  return (
    <Link
      to="/artists/$slug"
      params={{ slug: artist.slug }}
      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-glass group"
      onClick={() => trackSearchEvent("artist_click", { id: artist.id, name: artist.name })}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12 border-2 border-transparent transition-all group-hover:border-neon-purple">
          <AvatarImage src={artist.profile_image_url ?? undefined} alt={artist.name} className="object-cover" />
          <AvatarFallback className="bg-neon-purple/20 text-neon-purple font-bold">
            {artist.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {artist.verified && (
          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neon-blue">
            <BadgeCheck className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-semibold text-foreground group-hover:text-neon-purple transition-colors truncate">
            {artist.name}
          </p>
          {artist.verified && <BadgeCheck className="h-3.5 w-3.5 text-neon-blue flex-shrink-0" />}
        </div>
        {artist.bio && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{artist.bio}</p>
        )}
      </div>
      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function SectionLabel({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-1">
      <Icon className="h-4 w-4 text-neon-purple" />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      {count !== undefined && (
        <span className="ml-auto text-xs text-muted-foreground">{count} result{count !== 1 ? "s" : ""}</span>
      )}
    </div>
  );
}

function EmptyState({ query, tab }: { query: string; tab: SearchTab }) {
  const messages: Record<SearchTab, string> = {
    all: "No artists or videos found",
    videos: "No videos found",
    artists: "No artists found",
  };
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-glass border border-glass-border">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{messages[tab]}</p>
      <p className="text-xs text-muted-foreground">
        No results for <span className="text-neon-purple font-medium">"{query}"</span>. Try a different name.
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 border border-destructive/30">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-medium text-foreground">Something went wrong</p>
      <p className="text-xs text-muted-foreground">Couldn't reach Moonirat right now.</p>
      <button
        onClick={onRetry}
        className="mt-1 text-xs font-medium text-neon-purple underline underline-offset-2"
      >
        Try again
      </button>
    </div>
  );
}

function IdleState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-glass border border-glass-border">
        <Music2 className="h-6 w-6 text-neon-purple opacity-70" />
      </div>
      <p className="text-sm font-medium text-foreground">Find your next favourite</p>
      <p className="text-xs text-muted-foreground">Search artists and music videos on Moonirat.</p>
    </div>
  );
}

function SearchPage() {
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const debouncedQuery = useDebounce(inputValue.trim(), 300);
  const isQueryReady = debouncedQuery.length >= 1;

  const {
    data: artists,
    isLoading: artistsLoading,
    isError: artistsError,
    refetch: refetchArtists,
  } = useQuery({
    queryKey: ["search", "artists", debouncedQuery],
    queryFn: () => {
      trackSearchEvent("query", { q: debouncedQuery, type: "artists" });
      return searchArtists(debouncedQuery);
    },
    enabled: isQueryReady,
    staleTime: 30_000,
  });

  const {
    data: videos,
    isLoading: videosLoading,
    isError: videosError,
    refetch: refetchVideos,
  } = useQuery({
    queryKey: ["search", "videos", debouncedQuery],
    queryFn: () => {
      trackSearchEvent("query", { q: debouncedQuery, type: "videos" });
      return searchVideos(debouncedQuery);
    },
    enabled: isQueryReady,
    staleTime: 30_000,
  });

  const isLoading = artistsLoading || videosLoading;
  const isError = artistsError || videosError;
  const hasArtists = (artists?.length ?? 0) > 0;
  const hasVideos = (videos?.length ?? 0) > 0;
  const hasAnyResults = hasArtists || hasVideos;

  const tabs: { id: SearchTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "videos", label: "Videos" },
    { id: "artists", label: "Artists" },
  ];

  const showVideos = activeTab === "all" || activeTab === "videos";
  const showArtists = activeTab === "all" || activeTab === "artists";

  return (
    <div className="min-h-[100dvh] pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 glass border-b border-glass-border/40 px-4 py-3">
        <h1 className="text-lg font-bold text-foreground mb-2">Search</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Artists, music videos…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-9 pr-9 bg-glass border-glass-border h-10 text-sm focus-visible:ring-neon-purple/50"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {inputValue && (
            <button
              onClick={() => setInputValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-neon-purple text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                  : "bg-glass text-muted-foreground hover:text-foreground border border-glass-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-4">
        {/* Idle — no query yet */}
        {!isQueryReady && <IdleState />}

        {/* Loading */}
        {isQueryReady && isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-7 w-7 text-neon-purple animate-spin" />
            <p className="text-xs text-muted-foreground">Searching Moonirat…</p>
          </div>
        )}

        {/* Error */}
        {isQueryReady && !isLoading && isError && (
          <ErrorState onRetry={() => { refetchArtists(); refetchVideos(); }} />
        )}

        {/* No results */}
        {isQueryReady && !isLoading && !isError && !hasAnyResults && (
          <EmptyState query={debouncedQuery} tab={activeTab} />
        )}

        {/* Results */}
        {isQueryReady && !isLoading && !isError && hasAnyResults && (
          <div className="space-y-6">
            {/* Artists */}
            {showArtists && hasArtists && (
              <section>
                <SectionLabel icon={Users} label="Artists" count={artists!.length} />
                <div className="space-y-1">
                  {artists!.map((artist) => (
                    <ArtistResultRow key={artist.id} artist={artist} />
                  ))}
                </div>
              </section>
            )}

            {/* Videos */}
            {showVideos && hasVideos && (
              <section>
                <SectionLabel icon={Play} label="Videos" count={videos!.length} />
                <div className="space-y-2">
                  {videos!.map((video) => (
                    <VideoResultCard key={video.id} video={video} />
                  ))}
                </div>
              </section>
            )}

            {/* Per-tab empty sub-state */}
            {activeTab === "videos" && !hasVideos && (
              <EmptyState query={debouncedQuery} tab="videos" />
            )}
            {activeTab === "artists" && !hasArtists && (
              <EmptyState query={debouncedQuery} tab="artists" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
