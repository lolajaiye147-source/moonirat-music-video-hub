import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { setPlayerQueue } from "@/lib/player-queue";
import { videoPath } from "@/lib/video-links";

interface VideoCardProps {
  id: string;
  publicSlug: string;
  title: string;
  artistName: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
  viewCount?: number;
  queueIds?: string[];
  queueSource?: string;
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatViews(count: number) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return `${count}`;
}

export function VideoCard({ id, publicSlug, title, artistName, thumbnailUrl, duration, viewCount = 0, queueIds, queueSource = "Videos" }: VideoCardProps) {
  return (
    <Link
      to={videoPath({ public_slug: publicSlug })}
      onClick={() => queueIds && setPlayerQueue(queueIds, queueSource)}
      className="video-card group block flex-shrink-0 w-[280px] sm:w-[320px]"
    >
      <div className="relative aspect-video overflow-hidden rounded-t-lg">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-deep-navy">
            <Play className="h-12 w-12 text-neon-purple opacity-50" />
          </div>
        )}
        {duration && (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(duration)}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neon-purple/80 backdrop-blur-sm">
            <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{artistName}</p>
        {viewCount > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground">{formatViews(viewCount)} views</p>
        )}
      </div>
    </Link>
  );
}
