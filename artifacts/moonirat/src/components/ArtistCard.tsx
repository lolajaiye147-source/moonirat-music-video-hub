import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ArtistCardProps {
  slug: string;
  name: string;
  profileImageUrl?: string | null;
  verified?: boolean;
  followerCount?: number;
}

function formatFollowers(count: number) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return `${count}`;
}

export function ArtistCard({ slug, name, profileImageUrl, verified, followerCount = 0 }: ArtistCardProps) {
  return (
    <Link
      to="/artists/$slug"
      params={{ slug }}
      className="group flex flex-col items-center gap-2 rounded-2xl p-3 transition-colors hover:bg-glass"
    >
      <div className="relative">
        <Avatar className="h-16 w-16 border-2 border-transparent transition-all group-hover:border-neon-purple">
          <AvatarImage src={profileImageUrl ?? undefined} alt={name} className="object-cover" />
          <AvatarFallback className="bg-neon-purple/20 text-neon-purple text-lg font-bold">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {verified && (
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-neon-blue">
            <BadgeCheck className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground flex items-center gap-1 justify-center">
          {name}
          {verified && <BadgeCheck className="h-3 w-3 text-neon-blue inline" />}
        </p>
        {followerCount > 0 && (
          <p className="text-xs text-muted-foreground">{formatFollowers(followerCount)} followers</p>
        )}
      </div>
    </Link>
  );
}
