import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Heart, Share2, Plus, ListMusic } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/videos/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Video — Moonirat` },
      { name: "description", content: "Watch music videos on Moonirat." },
    ],
  }),
  component: VideoPage,
});

const relatedVideos = [
  { id: "2", title: "Neon Lights", artistName: "Cyber Wave", thumbnailUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=360&fit=crop", duration: 198, viewCount: 89000 },
  { id: "3", title: "Ocean Breeze", artistName: "Tidal Flow", thumbnailUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&h=360&fit=crop", duration: 245, viewCount: 67000 },
  { id: "5", title: "Electric Soul", artistName: "Voltage", thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=640&h=360&fit=crop", duration: 180, viewCount: 12000 },
];

function VideoPage() {
  const { id } = Route.useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Demo video data
  const video = {
    id,
    title: "Midnight Dreams",
    artistName: "Luna Echo",
    artistSlug: "luna-echo",
    description: "An ethereal journey through sound and light. Experience the magic of midnight. Official music video from the album 'Nocturnal'.",
    videoUrl: "",
    thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1280&h=720&fit=crop",
    duration: 215,
    viewCount: 125000,
    releaseDate: "2024-12-15",
    genre: "Electronic",
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-[100dvh] pb-20">
      {/* Video Player */}
      <div ref={containerRef} className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          poster={video.thumbnailUrl}
          onClick={togglePlay}
          playsInline
        >
          {/* Video source would be set dynamically */}
        </video>

        {/* Play overlay when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30" onClick={togglePlay}>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neon-purple/90 backdrop-blur-sm">
              <Play className="h-8 w-8 text-white ml-1" fill="white" />
            </div>
          </div>
        )}

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress bar */}
          <div className="mb-3">
            <div className="h-1 w-full rounded-full bg-white/20 cursor-pointer">
              <div
                className="h-full rounded-full bg-neon-purple"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:text-neon-purple transition-colors">
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>
              <button className="text-white/70 hover:text-white transition-colors">
                <SkipForward className="h-5 w-5" />
              </button>
              <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <span className="text-xs text-white/70">
                {formatTime((progress / 100) * video.duration)} / {formatTime(video.duration)}
              </span>
            </div>
            <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">{video.title}</h1>
        <div className="mt-2 flex items-center gap-2">
          <Link to="/artists/$slug" params={{ slug: video.artistSlug }}>
            <Avatar className="h-8 w-8 border border-glass-border">
              <AvatarImage src={`https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face`} />
              <AvatarFallback className="bg-neon-purple/20 text-neon-purple text-xs">{video.artistName[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <Link to="/artists/$slug" params={{ slug: video.artistSlug }} className="text-sm font-medium text-foreground hover:text-neon-purple">
            {video.artistName}
          </Link>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {video.viewCount.toLocaleString()} views • {video.releaseDate} • {video.genre}
        </p>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{video.description}</p>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <Button
            variant={isLiked ? "default" : "outline"}
            size="sm"
            onClick={() => { setIsLiked(!isLiked); toast.success(isLiked ? "Removed from favorites" : "Added to favorites"); }}
            className={isLiked ? "bg-neon-purple hover:bg-neon-purple/90" : "border-glass-border bg-glass"}
          >
            <Heart className={`h-4 w-4 mr-1.5 ${isLiked ? "fill-white" : ""}`} />
            {isLiked ? "Liked" : "Like"}
          </Button>
          <Button variant="outline" size="sm" className="border-glass-border bg-glass" onClick={() => toast.success("Link copied to clipboard")}>
            <Share2 className="h-4 w-4 mr-1.5" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="border-glass-border bg-glass" onClick={() => toast.info("Select a playlist to add to")}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Related Videos */}
      <div className="px-4 py-4 border-t border-border">
        <h2 className="text-lg font-bold text-foreground mb-3">Up Next</h2>
        <div className="space-y-3">
          {relatedVideos.map((v) => (
            <div key={v.id} className="flex gap-3 group cursor-pointer">
              <Link to="/videos/$id" params={{ id: v.id }} className="relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden">
                <img src={v.thumbnailUrl} alt={v.title} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-xs text-white">
                  {Math.floor(v.duration / 60)}:{(v.duration % 60).toString().padStart(2, "0")}
                </div>
              </Link>
              <div className="flex-1 py-1">
                <Link to="/videos/$id" params={{ id: v.id }}>
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-neon-purple">{v.title}</h3>
                </Link>
                <Link to="/artists/$slug" params={{ slug: v.artistName.toLowerCase().replace(/\s+/g, "-") }}>
                  <p className="text-xs text-muted-foreground mt-0.5">{v.artistName}</p>
                </Link>
                <p className="text-xs text-muted-foreground">{v.viewCount.toLocaleString()} views</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
