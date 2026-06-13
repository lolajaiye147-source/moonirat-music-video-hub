'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Eye, Play } from 'lucide-react';
import type { Video } from '@/services/video.service';

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

interface Props {
  video: Video;
  variant?: 'card' | 'row';
}

export default function VideoCard({ video, variant = 'card' }: Props) {
  if (variant === 'row') {
    return (
      <Link href={`/video/${video.id}`} className="flex gap-3 group hover:bg-dark-700 rounded-xl p-2 transition-colors">
        <div className="relative w-28 h-16 rounded-lg overflow-hidden shrink-0 bg-dark-600">
          {video.thumbnailUrl ? (
            <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-dark-400">
              <Play className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <p className="text-sm font-medium text-white truncate group-hover:text-moon-300 transition-colors">{video.title}</p>
          <p className="text-xs text-gray-500 truncate">{video.artist?.name}</p>
          <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
            <Eye className="w-3 h-3" /> {formatViews(video.views)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/video/${video.id}`} className="group card hover:border-dark-500 transition-all duration-200">
      <div className="relative aspect-video bg-dark-700 overflow-hidden">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl} alt={video.title} fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-dark-500">
            <Play className="w-10 h-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-white truncate group-hover:text-moon-300 transition-colors">
          {video.title}
        </h3>
        {video.artist && (
          <p className="text-xs text-gray-400 mt-1 truncate">{video.artist.name}</p>
        )}
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
          <Eye className="w-3 h-3" />
          {formatViews(video.views)} views
        </div>
      </div>
    </Link>
  );
}
