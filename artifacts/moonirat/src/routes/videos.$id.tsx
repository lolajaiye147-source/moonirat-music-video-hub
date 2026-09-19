import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type Hls from "hls.js";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Cast,
  Heart,
  Maximize,
  Minimize,
  MessageCircle,
  Pause,
  Play,
  Plus,
  Share2,
  SkipBack,
  SkipForward,
  Trash2,
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
  createVideoComment,
  deleteVideoComment,
  getVideoEngagement,
  setVideoLike,
  type VideoWithArtist,
} from "@/lib/moonirat-data";
import { getPlayerQueue, setPlayerQueue } from "@/lib/player-queue";
import { videoPath, videoUrl } from "@/lib/video-links";

export const Route = createFileRoute("/videos/$id")({
  head: () => ({
    meta: [
      { title: `Video — Moonirat` },
      { name: "description", content: "Watch music videos on Moonirat." },
    ],
  }),
  component: LegacyVideoPage,
});

function LegacyVideoPage() {
  const { id } = Route.useParams();
  return <VideoPage videoId={id} legacy />;
}

function formatTime(seconds: number | null | undefined) {
  const value = Math.max(0, Math.floor(seconds ?? 0));
  return `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, "0")}`;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RemotePlaybackMedia = HTMLVideoElement & {
  remote?: {
    prompt: () => Promise<void>;
  };
  webkitEnterFullscreen?: () => void;
  webkitShowPlaybackTargetPicker?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

function getDirectVideoSource(video: VideoWithArtist) {
  if (video.video_url?.trim()) return video.video_url.trim();
  if (video.storage_path) {
    const storageUrl = supabasePublicUrl("videos", video.storage_path);
    if (storageUrl) return storageUrl;
  }
  return null;
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

function withPlaybackAttempt(source: string, attempt: number) {
  if (attempt === 0) return source;
  try {
    const url = new URL(source);
    url.searchParams.set("moonirat_retry", String(attempt));
    return url.toString();
  } catch {
    return source;
  }
}

export function VideoPage({ videoId: id, legacy = false }: { videoId: string; legacy?: boolean }) {
  const navigate = useNavigate();
  const isValidVideoId = UUID_PATTERN.test(id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [playbackAttempt, setPlaybackAttempt] = useState(0);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [playerQueue, setCurrentPlayerQueue] = useState(() => getPlayerQueue(id));
  const [castAvailable, setCastAvailable] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSavedAt = useRef(0);
  const watchedSeconds = useRef(0);
  const lastPlaybackTime = useRef<number | null>(null);

  const videoQuery = useQuery({
    queryKey: ["video", id],
    queryFn: () => getVideo(id),
    staleTime: 30_000,
    enabled: isValidVideoId,
  });
  const video = videoQuery.data;
  useEffect(() => {
    if (!legacy || !video) return;
    void navigate({ to: videoPath(video), replace: true });
  }, [legacy, navigate, video]);
  const hlsSource = video?.master_playlist_url?.trim() || null;
  const directSource = video ? getDirectVideoSource(video) : null;
  const hasMediaSource = Boolean(hlsSource || directSource);
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
  const queueIndex = playerQueue?.ids.indexOf(id) ?? -1;
  const previousVideoId = queueIndex > 0 ? playerQueue!.ids[queueIndex - 1] : null;
  const nextVideoId =
    playerQueue && queueIndex >= 0 && queueIndex < playerQueue.ids.length - 1
      ? playerQueue.ids[queueIndex + 1]
      : null;
  const playlistsQuery = useQuery({
    queryKey: ["playlists", user?.id],
    queryFn: () => getUserPlaylists(user!.id),
    enabled: Boolean(user?.id && showPlaylists),
  });
  const engagementQuery = useQuery({
    queryKey: ["video", id, "engagement", user?.id ?? null],
    queryFn: () => getVideoEngagement(id, user?.id),
    enabled: Boolean(video),
    staleTime: 15_000,
  });
  const likeMutation = useMutation({
    mutationFn: (liked: boolean) => setVideoLike(user!.id, id, liked),
    onMutate: async (liked) => {
      const key = ["video", id, "engagement", user?.id ?? null] as const;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof getVideoEngagement>>>(key);
      if (previous) {
        queryClient.setQueryData(key, {
          ...previous,
          likedByUser: liked,
          likeCount: Math.max(0, previous.likeCount + (liked ? 1 : -1)),
        });
      }
      return { previous, key };
    },
    onError: (error, _liked, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
      toast.error(error instanceof Error ? error.message : "Like update failed");
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: ["video", id, "engagement", user?.id ?? null],
      }),
  });
  const commentMutation = useMutation({
    mutationFn: (body: string) => createVideoComment(user!.id, id, body),
    onSuccess: () => {
      setCommentBody("");
      void queryClient.invalidateQueries({
        queryKey: ["video", id, "engagement"],
      });
      toast.success("Comment posted");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Comment could not be posted"),
  });
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteVideoComment(user!.id, commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["video", id, "engagement"] });
      toast.success("Comment deleted");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Comment could not be deleted"),
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
    if (!element || !hasMediaSource) return;
    element.setAttribute("x-webkit-airplay", "allow");
    const remoteElement = element as RemotePlaybackMedia;
    setCastAvailable(
      Boolean(remoteElement.remote?.prompt || remoteElement.webkitShowPlaybackTargetPicker),
    );

    let hls: Hls | null = null;
    let attemptedDirect = false;
    let disposed = false;
    setMediaError(null);

    const loadDirectSource = () => {
      if (!directSource) return false;
      attemptedDirect = true;
      element.src = withPlaybackAttempt(directSource, playbackAttempt);
      element.load();
      return true;
    };

    const failOrUseDirectSource = () => {
      if (disposed) return;
      if (!attemptedDirect && directSource && directSource !== hlsSource) {
        hls?.destroy();
        hls = null;
        setMediaError(null);
        loadDirectSource();
        return;
      }
      setMediaError(
        element.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
          ? "This browser cannot decode this video's format. Try an up-to-date Chrome, Safari, or Firefox browser."
          : "This video could not be played. Check your connection and try again.",
      );
    };

    element.addEventListener("error", failOrUseDirectSource);

    if (hlsSource && element.canPlayType("application/vnd.apple.mpegurl")) {
      element.src = withPlaybackAttempt(hlsSource, playbackAttempt);
      element.load();
    } else if (hlsSource) {
      void import("hls.js").then(({ default: HlsPlayer }) => {
        if (disposed) return;
        if (!HlsPlayer.isSupported()) {
          failOrUseDirectSource();
          return;
        }
        hls = new HlsPlayer();
        hls.loadSource(withPlaybackAttempt(hlsSource, playbackAttempt));
        hls.attachMedia(element);
        hls.on(HlsPlayer.Events.ERROR, (_event, data) => {
          if (data.fatal) failOrUseDirectSource();
        });
      });
    } else if (!loadDirectSource()) {
      setMediaError("This video does not have a playable media source.");
    }

    return () => {
      disposed = true;
      element.removeEventListener("error", failOrUseDirectSource);
      hls?.destroy();
      element.removeAttribute("src");
      element.load();
    };
  }, [directSource, hasMediaSource, hlsSource, playbackAttempt]);

  useEffect(() => {
    setCurrentPlayerQueue(getPlayerQueue(id));
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setMediaError(null);
    setPlaybackAttempt(0);
    setViewRecorded(false);
    lastSavedAt.current = 0;
    watchedSeconds.current = 0;
    lastPlaybackTime.current = null;
  }, [id]);

  useEffect(() => {
    const syncFullscreenState = () => {
      const video = videoRef.current as RemotePlaybackMedia | null;
      setIsFullscreen(
        Boolean(document.fullscreenElement) ||
          Boolean(video?.webkitDisplayingFullscreen),
      );
    };
    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      document.removeEventListener("webkitfullscreenchange", syncFullscreenState);
    };
  }, []);

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
    if (!element || !hasMediaSource || mediaError) return;
    if (element.paused) {
      try {
        await element.play();
        setIsPlaying(true);
        lastPlaybackTime.current = element.currentTime;
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
    const video = videoRef.current as RemotePlaybackMedia | null;
    if (!containerRef.current || !video) return;
    try {
      if (!document.fullscreenElement) {
        if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        } else if (video.requestFullscreen) {
          await video.requestFullscreen();
        } else {
          await containerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement));
      toast.error(
        "Fullscreen was blocked. Open Moonirat in a browser tab and try again.",
      );
    }
  };

  const castVideo = async () => {
    const video = videoRef.current as RemotePlaybackMedia | null;
    if (!video) return;
    try {
      if (video.remote?.prompt) {
        await video.remote.prompt();
        return;
      }
      if (video.webkitShowPlaybackTargetPicker) {
        video.webkitShowPlaybackTargetPicker();
        return;
      }
      toast.error("No compatible TV or AirPlay device is available in this browser.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        toast.error("Casting was blocked. Try again from a normal browser tab.");
        return;
      }
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Moonirat could not connect to a casting device.");
    }
  };

  const shareVideo = async () => {
    if (!video) return;
    const url = videoUrl(video);
    try {
      if (navigator.share) {
        await navigator.share({ title: video?.title ?? "Moonirat video", url });
        return;
      }
      if (!navigator.clipboard) throw new Error("Clipboard is unavailable");
      await navigator.clipboard.writeText(url);
      toast.success("Video link copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("This video could not be shared. Copy the address from your browser.");
    }
  };

  const submitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    commentMutation.mutate(commentBody);
  };

  const navigateInQueue = async (targetId: string | null) => {
    if (!targetId) return;
    const element = videoRef.current;
    if (element) await persistProgress(element);
    try {
      const targetVideo = await getVideo(targetId);
      await navigate(
        targetVideo
          ? { to: videoPath(targetVideo) }
          : { to: "/videos/$id", params: { id: targetId } },
      );
    } catch {
      toast.error("That video could not be opened.");
    }
  };

  useEffect(() => {
    if (!video || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: video.title,
      artist: video.artists?.name ?? "Moonirat",
      artwork: video.thumbnail_url
        ? [{ src: video.thumbnail_url, sizes: "512x512", type: "image/jpeg" }]
        : [],
    });
    const safeSetHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null,
    ) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // The current browser does not implement this Media Session action.
      }
    };
    safeSetHandler("play", () => void videoRef.current?.play());
    safeSetHandler("pause", () => videoRef.current?.pause());
    safeSetHandler("previoustrack", previousVideoId ? () => void navigateInQueue(previousVideoId) : null);
    safeSetHandler("nexttrack", nextVideoId ? () => void navigateInQueue(nextVideoId) : null);
    return () => {
      safeSetHandler("play", null);
      safeSetHandler("pause", null);
      safeSetHandler("previoustrack", null);
      safeSetHandler("nexttrack", null);
    };
  }, [nextVideoId, previousVideoId, video]);

  if (videoQuery.isLoading) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-purple border-t-transparent" />
      </div>
    );
  }
  if (!isValidVideoId || videoQuery.isError || !video) {
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
        {hasMediaSource ? (
          <video
            key={playbackAttempt}
            ref={videoRef}
            className="h-full w-full bg-black object-contain"
            poster={video.thumbnail_url ?? undefined}
            onClick={togglePlay}
            onPlay={(event) => {
              setIsPlaying(true);
              lastPlaybackTime.current = event.currentTarget.currentTime;
            }}
            onPause={() => {
              setIsPlaying(false);
              lastPlaybackTime.current = null;
            }}
            onSeeking={() => {
              lastPlaybackTime.current = null;
            }}
            onEnded={() => {
              setIsPlaying(false);
              void persistProgress(videoRef.current!);
              if (nextVideoId) void navigateInQueue(nextVideoId);
            }}
            onTimeUpdate={(event) => {
              const element = event.currentTarget;
              const previousTime = lastPlaybackTime.current;
              const delta = previousTime === null ? 0 : element.currentTime - previousTime;
              if (!element.paused && delta > 0 && delta <= 2.5) {
                watchedSeconds.current += delta;
              }
              lastPlaybackTime.current = element.currentTime;
              if (!viewRecorded && watchedSeconds.current >= 3) {
                setViewRecorded(true);
                void recordVideoView(video.id, watchedSeconds.current, element.currentTime).catch(() => {
                  setViewRecorded(false);
                  toast.error("We couldn't record this view, but playback is still available.");
                });
              }
              setCurrentTime(element.currentTime);
              setProgress(element.duration ? (element.currentTime / element.duration) * 100 : 0);
              void persistProgress(element);
            }}
            preload="metadata"
            playsInline
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="font-semibold">Video unavailable</p>
            <p className="text-sm text-white/70">
              This video does not have a playable media source yet.
            </p>
          </div>
        )}

        {mediaError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center text-white">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="font-semibold">Playback failed</p>
            <p className="max-w-sm text-sm text-white/70">{mediaError}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/30 bg-black/20 text-white hover:bg-white/10 disabled:opacity-30"
                disabled={!previousVideoId}
                onClick={() => void navigateInQueue(previousVideoId)}
              >
                <SkipBack className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMediaError(null);
                  setPlaybackAttempt((attempt) => attempt + 1);
                }}
              >
                Retry playback
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-white/30 bg-black/20 text-white hover:bg-white/10 disabled:opacity-30"
                disabled={!nextVideoId}
                onClick={() => void navigateInQueue(nextVideoId)}
              >
                Next
                <SkipForward className="ml-2 h-4 w-4" />
              </Button>
              {castAvailable && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/30 bg-black/20 text-white hover:bg-white/10"
                  onClick={() => void castVideo()}
                >
                  <Cast className="mr-2 h-4 w-4" />
                  Cast to TV
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="border-white/30 bg-black/20 text-white hover:bg-white/10"
                onClick={() => void toggleFullscreen()}
              >
                {isFullscreen ? (
                  <Minimize className="mr-2 h-4 w-4" />
                ) : (
                  <Maximize className="mr-2 h-4 w-4" />
                )}
                {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              </Button>
            </div>
          </div>
        )}

        {hasMediaSource && !mediaError && !isPlaying && (
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

        {hasMediaSource && !mediaError && (
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
                  onClick={() => void navigateInQueue(previousVideoId)}
                  disabled={!previousVideoId}
                  className="text-white/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous video"
                  title="Previous video"
                >
                  <SkipBack className="h-5 w-5" />
                </button>
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
                  onClick={() => void navigateInQueue(nextVideoId)}
                  disabled={!nextVideoId}
                  className="text-white/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next video"
                  title="Next video"
                >
                  <SkipForward className="h-5 w-5" />
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
              <div className="flex items-center gap-4">
                {castAvailable && (
                  <button
                    type="button"
                    onClick={() => void castVideo()}
                    className="text-white/70 hover:text-white"
                    aria-label="Cast to TV or AirPlay device"
                    title="Cast to TV"
                  >
                    <Cast className="h-5 w-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  className="text-white/70 hover:text-white"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  title="Fullscreen"
                >
                  {isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </button>
              </div>
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
          {user ? (
            <Button
              variant="outline"
              size="sm"
              className={`border-glass-border bg-glass ${
                engagementQuery.data?.likedByUser ? "text-neon-purple" : ""
              }`}
              disabled={engagementQuery.isLoading || likeMutation.isPending}
              onClick={() => likeMutation.mutate(!engagementQuery.data?.likedByUser)}
              aria-pressed={engagementQuery.data?.likedByUser}
            >
              <Heart
                className="mr-1.5 h-4 w-4"
                fill={engagementQuery.data?.likedByUser ? "currentColor" : "none"}
              />
              {engagementQuery.data?.likeCount ?? 0}
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="border-glass-border bg-glass">
                <Heart className="mr-1.5 h-4 w-4" /> {engagementQuery.data?.likeCount ?? 0}
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-glass-border bg-glass"
            onClick={() => void shareVideo()}
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

      <section className="border-t border-border px-4 py-5" aria-labelledby="comments-heading">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-neon-purple" />
          <h2 id="comments-heading" className="text-lg font-bold text-foreground">
            Comments ({engagementQuery.data?.comments.length ?? 0})
          </h2>
        </div>
        {user ? (
          <form onSubmit={submitComment} className="mb-5">
            <textarea
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Share your thoughts…"
              aria-label="Add a comment"
              className="w-full resize-none rounded-xl border border-glass-border bg-glass px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-neon-purple"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{commentBody.length}/1000</span>
              <Button
                type="submit"
                size="sm"
                disabled={!commentBody.trim() || commentMutation.isPending}
                className="bg-neon-purple hover:bg-neon-purple/90"
              >
                {commentMutation.isPending ? "Posting…" : "Post comment"}
              </Button>
            </div>
          </form>
        ) : (
          <Link to="/auth" className="mb-5 block">
            <Button variant="outline" className="w-full border-glass-border bg-glass">
              Sign in to comment
            </Button>
          </Link>
        )}
        {engagementQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Loading comments…</p>
        )}
        {engagementQuery.isError && (
          <p className="text-sm text-destructive">Comments could not be loaded.</p>
        )}
        {!engagementQuery.isLoading &&
          !engagementQuery.isError &&
          !engagementQuery.data?.comments.length && (
            <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
          )}
        <div className="space-y-4">
          {engagementQuery.data?.comments.map((comment) => {
            const name =
              comment.profile?.display_name || comment.profile?.username || "Moonirat listener";
            return (
              <article key={comment.id} className="flex gap-3">
                <Avatar className="h-9 w-9 border border-glass-border">
                  <AvatarImage src={comment.profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-neon-purple/20 text-xs text-neon-purple">
                    {name[0]?.toUpperCase() ?? "M"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                    {user?.id === comment.user_id && (
                      <button
                        type="button"
                        className="rounded p-1 text-muted-foreground hover:text-destructive"
                        aria-label="Delete comment"
                        disabled={deleteCommentMutation.isPending}
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                    {comment.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

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
                to={videoPath(related)}
                onClick={() => {
                  const ids = [id, ...(relatedQuery.data ?? []).map((item) => item.id)];
                  setPlayerQueue(ids, "Related videos");
                  setCurrentPlayerQueue(getPlayerQueue(id));
                }}
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
                <Link
                  to={videoPath(related)}
                  onClick={() => {
                    const ids = [id, ...(relatedQuery.data ?? []).map((item) => item.id)];
                    setPlayerQueue(ids, "Related videos");
                  }}
                >
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
