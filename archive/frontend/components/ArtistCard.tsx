'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, Users } from 'lucide-react';
import type { ArtistProfile } from '@/services/artist.service';

interface Props { artist: ArtistProfile; }

export default function ArtistCard({ artist }: Props) {
  return (
    <Link href={`/artist/${artist.id}`} className="group flex flex-col items-center gap-3 p-4 card hover:border-dark-500 transition-all duration-200 text-center">
      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-dark-600 shrink-0">
        {artist.profileImage ? (
          <Image src={artist.profileImage} alt={artist.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-moon-400">
            {artist.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center justify-center gap-1">
          <p className="font-semibold text-sm text-white truncate group-hover:text-moon-300 transition-colors">
            {artist.name}
          </p>
          {artist.verified && <BadgeCheck className="w-4 h-4 text-moon-400 shrink-0" />}
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
          <Users className="w-3 h-3" />
          {artist.followersCount} followers
        </div>
      </div>
    </Link>
  );
}
