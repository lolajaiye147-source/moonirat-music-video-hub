import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Maximize,
  Pause,
  Play,
  Plus,
  Share2,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  getRelatedVideos,
  getVideo,
  addVideoToPlaylist,
  getUserPlaylists,
  removeVideoFromPlaylist,
  getWatchHistory,
  recordVideoView,
  saveWatchProgress,
  type VideoWithArtist,
} from "@/lib/moonirat-data";

export const Route = createFileRoute("/videos/$id")({
  head: () => ({
    meta: [
      { title: `Video — Moonirat` },
      { name: "description", content: "Watch music videos on Moonirat." },
    ],
  }),
  component: VideoPage,
});

function formatTime(seconds: number | null | undefined) {
  const value = Math.max(0, Math.floor(seconds ?? 0));
  return `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, "0")}`;
}

function getVideoSource(video: VideoWithArtist) {
  if (video.master_playlist_url) return video.master_playlist_url;
  if (video.storage_path) {
    const storageUrl = supabasePublicUrl("videos", video.storage_path);
    if (storageUrl) return storageUrl;
  }
  return video.video_url || null;
}

function supabasePublicUrl(bucket: string, path: string) {
  const { data } = import.meta.env.VITE_SUPABASE_URL
    ? {
        data: {
          publicUrl: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`,
        },
      }
    : { data: { publicUrl: null } };
  return data.publicUrl;
}

function VideoPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSavedAt = useRef(0);

  const videoQuery = useQuery({
    queryKey: ["video", id],
    queryFn: () => getVideo(id),
    staleTime: 30_000,
  });
  const video = videoQuery.data;
  const source = useMemo(() => (video ? getVideoSource(video) : null), [video]);
  const historyQuery = useQuery({
    queryKey: ["watch-history", user?.id, id],
    queryFn: () => getWatchHistory(user!.id, id),
    enabled: Boolean(user?.id && video),
  });
  const relatedQuery = useQuery({
    queryKey: ["video", id, "related", video?.genre],
    queryFn: () => getRelatedVideos(video!),
    enabled: Boolean(video),
  });
  const playlistsQuery = useQuery({
    queryKey: ["playlists", user?.id],
    queryFn: () => getUserPlaylists(user!.id),
    enabled: Boolean(user?.id && showPlaylists),
  });
  const playlistMutation = useMutation({
    mutationFn: ({ playlistId, included }: { playlistId: string; included: boolean }) =>
      included ? removeVideoFromPlaylist(playlistId, id) : addVideoToPlaylist(playlistId, id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["playlists", user?.id] });
      toast.success(variables.included ? "Removed from playlist" : "Added to playlist");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Playlist update failed"),
  });

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !source) return;
    setMediaError(null);

    if (source.includes(".m3u8") && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(source);
      hls.attachMedia(element);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setMediaError("This video could not be loaded.");
      });
      return () => hls.destroy();
    }
    if (source.includes(".m3u8") && element.canPlayType("application/vnd.apple.mpegurl")) {
      element.src = source;
      return () => {
        element.removeAttribute("src");
        element.load();
      };
    }
    element.src = source;
    return () => {
      element.removeAttribute("src");
      element.load();
    };
  }, [source]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !historyQuery.data?.progress_seconds || historyQuery.data.completed) return;
    const restore = () => {
      if (element.duration && historyQuery.data!.progress_seconds < element.duration) {
        element.currentTime = historyQuery.data!.progress_seconds;
        setCurrentTime(element.currentTime);
      }
    };
    if (element.readyState >= 1) restore();
    else element.addEventListener("loadedmetadata", restore, { once: true });
    return () => element.removeEventListener("loadedmetadata", restore);
  }, [historyQuery.data]);

  const persistProgress = async (element: HTMLVideoElement) => {
    if (!user?.id || !video || !Number.isFinite(element.currentTime)) return;
    if (element.currentTime - lastSavedAt.current < 4 && !element.ended) return;
    lastSavedAt.current = element.currentTime;
    try {
      await saveWatchProgress(
        user.id,
        video.id,
        element.currentTime,
        Number.isFinite(element.duration) ? element.duration : video.duration,
      );
    } catch {
      toast.error("We couldn't save your watch progress.");
    }
  };

  const togglePlay = async () => {
    const element = videoRef.current;
    if (!element || !source || mediaError) return;
    if (element.paused) {
      try {
        await element.play();
        setIsPlaying(true);
        if (!viewRecorded) {
          void recordVideoView(video!.id, user?.id)
            .then(() => setViewRecorded(true))
            .catch(() =>
              toast.error("We couldn't record this view, but playback is still available."),
            );
        }
      } catch {
        setMediaError("Playback was blocked by the browser. Try pressing play again.");
      }
    } else {
      element.pause();
      setIsPlaying(false);
      await persistProgress(element);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (videoQuery.isLoading) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-purple border-t-transparent" />
      </div>
    );
  }
  if (videoQuery.isError || !video) {
    return (
      <StateMessage
        icon={<AlertCircle className="h-6 w-6 text-destructive" />}
        title="Video unavailable"
        message="This video could not be found or is no longer public."
      />
    );
  }

  return (
    <div className="min-h-[100dvh] pb-20">
      <div ref={containerRef} className="relative aspect-video bg-black">
        {source && !mediaError ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster={video.thumbnail_url ?? undefined}
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              void persistProgress(videoRef.current!);
              const nextVideo = relatedQuery.data?.[0];
              if (nextVideo) void navigate({ to: "/videos/$id", params: { id: nextVideo.id } });
            }}
            onTimeUpdate={(event) => {
              const element = event.currentTarget;
              setCurrentTime(element.currentTime);
              setProgress(element.duration ? (element.currentTime / element.duration) * 100 : 0);
              void persistProgress(element);
            }}
            onError={() => setMediaError("This video could not be loaded.")}
            playsInline
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="font-semibold">Playback unavailable</p>
            <p className="text-sm text-white/70">
              This video does not have a playable media source yet.
            </p>
          </div>
        )}

        {source && !mediaError && !isPlaying && (
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center bg-black/30"
            onClick={togglePlay}
            aria-label="Play video"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neon-purple/90">
              <Play className="ml-1 h-8 w-8 text-white" fill="white" />
            </span>
          </button>
        )}

        {source && !mediaError && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <input
              aria-label="Video progress"
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(event) => {
                const element = videoRef.current;
                if (!element || !element.duration) return;
                element.currentTime = (Number(event.target.value) / 100) * element.duration;
              }}
              className="mb-3 h-1 w-full accent-neon-purple"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="text-white"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }}
                  className="text-white/70"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <span className="text-xs text-white/70">
                  {formatTime(currentTime)} / {formatTime(video.duration)}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="text-white/70"
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">{video.title}</h1>
        <div className="mt-2 flex items-center gap-2">
          <Link to="/artists/$slug" params={{ slug: video.artists?.slug ?? "" }}>
            <Avatar className="h-8 w-8 border border-glass-border">
              <AvatarImage src={video.artists?.profile_image_url ?? undefined} />
              <AvatarFallback className="bg-neon-purple/20 text-neon-purple text-xs">
                {video.artists?.name?.[0] ?? "A"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <Link
            to="/artists/$slug"
            params={{ slug: video.artists?.slug ?? "" }}
            className="text-sm font-medium text-foreground hover:text-neon-purple"
          >
            {video.artists?.name ?? "Unknown artist"}
          </Link>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {video.view_count.toLocaleString()} views •{" "}
          {video.release_date ?? new Date(video.created_at).toLocaleDateString()}{" "}
          {video.genre ? `• ${video.genre}` : ""}
        </p>
        {video.description && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{video.description}</p>
        )}
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-glass-border bg-glass"
            onClick={() => {
              void navigator.clipboard?.writeText(window.location.href);
              toast.success("Link copied to clipboard");
            }}
          >
            <Share2 className="mr-1.5 h-4 w-4" /> Share
          </Button>
          {user ? (
            <Button
              variant="outline"
              size="sm"
              className="border-glass-border bg-glass"
              onClick={() => setShowPlaylists((open) => !open)}
            >
              <Plus className="mr-1.5 h-4 w-4" /> {showPlaylists ? "Close" : "Add"}
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="border-glass-border bg-glass">
                <Plus className="mr-1.5 h-4 w-4" /> Sign in to add
              </Button>
            </Link>
          )}
        </div>
        {showPlaylists && user && (
          <div className="mt-3 rounded-xl border border-glass-border bg-glass p-3">
            {playlistsQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Loading playlists…</p>
            )}
            {playlistsQuery.isError && (
              <p className="text-sm text-destructive">Your playlists could not be loaded.</p>
            )}
            {!playlistsQuery.isLoading &&
              !playlistsQuery.isError &&
              !playlistsQuery.data?.length && (
                <p className="text-sm text-muted-foreground">
                  Create a playlist in Library before adding videos.
                </p>
              )}
            {!!playlistsQuery.data?.length && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={selectedPlaylistId || playlistsQuery.data[0].id}
                  onChange={(event) => setSelectedPlaylistId(event.target.value)}
                  className="h-9 flex-1 rounded-md border border-glass-border bg-background px-3 text-sm text-foreground"
                  aria-label="Choose a playlist"
                >
                  {playlistsQuery.data.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </option>
                  ))}
                </select>
                {(() => {
                  const selected = playlistsQuery.data.find(
                    (playlist) => playlist.id === (selectedPlaylistId || playlistsQuery.data[0].id),
                  );
                  const included = Boolean(
                    selected?.playlist_videos.some((entry) => entry.video_id === id),
                  );
                  return (
                    <Button
                      size="sm"
                      disabled={playlistMutation.isPending}
                      onClick={() =>
                        selected && playlistMutation.mutate({ playlistId: selected.id, included })
                      }
                      className="bg-neon-purple hover:bg-neon-purple/90"
                    >
                      {playlistMutation.isPending
                        ? "Saving…"
                        : included
                          ? "Remove"
                          : "Add to playlist"}
                    </Button>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-4">
        <h2 className="mb-3 text-lg font-bold text-foreground">Up Next</h2>
        {relatedQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Loading related videos…</p>
        )}
        {relatedQuery.isError && (
          <p className="text-sm text-destructive">Related videos could not be loaded.</p>
        )}
        {!relatedQuery.isLoading && !relatedQuery.isError && relatedQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No related videos yet.</p>
        )}
        <div className="space-y-3">
          {relatedQuery.data?.map((related) => (
            <div key={related.id} className="group flex gap-3">
              <Link
                to="/videos/$id"
                params={{ id: related.id }}
                className="relative w-40 flex-shrink-0 overflow-hidden rounded-lg aspect-video"
              >
                {related.thumbnail_url ? (
                  <img
                    src={related.thumbnail_url}
                    alt={related.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-deep-navy">
                    <Play className="h-6 w-6 text-neon-purple" />
                  </div>
                )}
              </Link>
              <div className="flex-1 py-1">
                <Link to="/videos/$id" params={{ id: related.id }}>
                  <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-neon-purple">
                    {related.title}
                  </h3>
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {related.artists?.name ?? "Unknown artist"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {related.view_count.toLocaleString()} views
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StateMessage({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-glass">{icon}</div>
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
