import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck, Users, Music, Share2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  getArtist,
  getArtistVideos,
  getFollowState,
  getFollowerCount,
  setFollowState,
  type Artist,
  type VideoWithArtist,
} from "@/lib/moonirat-data";

export const Route = createFileRoute("/artists/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Moonirat` },
      { name: "description", content: "Discover artist profiles on Moonirat." },
    ],
  }),
  component: ArtistPage,
});

function ArtistPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const artistQuery = useQuery({ queryKey: ["artist", slug], queryFn: () => getArtist(slug) });
  const artist = artistQuery.data;
  const videosQuery = useQuery({
    queryKey: ["artist", slug, "videos"],
    queryFn: () => getArtistVideos(artist!.id),
    enabled: Boolean(artist),
  });
  const followersQuery = useQuery({
    queryKey: ["artist", artist?.id, "followers"],
    queryFn: () => getFollowerCount(artist!.id),
    enabled: Boolean(artist),
  });
  const followQuery = useQuery({
    queryKey: ["follow", user?.id, artist?.id],
    queryFn: () => getFollowState(user!.id, artist!.id),
    enabled: Boolean(user?.id && artist),
  });
  const followMutation = useMutation({
    mutationFn: (following: boolean) => setFollowState(user!.id, artist!.id, following),
    onSuccess: (_data, following) => {
      queryClient.setQueryData(["follow", user?.id, artist?.id], following);
      void queryClient.invalidateQueries({ queryKey: ["artist", artist?.id, "followers"] });
      toast.success(following ? `Following ${artist!.name}` : `Unfollowed ${artist!.name}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Follow change failed"),
  });

  if (artistQuery.isLoading) return <LoadingState />;
  if (artistQuery.isError || !artist) return <StateMessage title="Artist unavailable" message="This artist profile could not be found." />;

  const following = followQuery.data ?? false;
  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="relative h-40 w-full bg-deep-navy">
        {artist.cover_image_url && <img src={artist.cover_image_url} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>
      <div className="relative -mt-12 px-4">
        <Avatar className="h-24 w-24 border-4 border-background">
          <AvatarImage src={artist.profile_image_url ?? undefined} alt={artist.name} className="object-cover" />
          <AvatarFallback className="bg-neon-purple/20 text-2xl font-bold text-neon-purple">{artist.name[0]}</AvatarFallback>
        </Avatar>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{artist.name}</h1>
            {artist.verified && <BadgeCheck className="h-5 w-5 text-neon-blue" />}
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-4 w-4" />{(followersQuery.data ?? 0).toLocaleString()} followers</span>
            <span className="flex items-center gap-1"><Music className="h-4 w-4" />{videosQuery.data?.length ?? 0} videos</span>
          </div>
          {artist.bio && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{artist.bio}</p>}
          <div className="mt-4 flex gap-2">
            {user ? (
              <Button
                disabled={followQuery.isLoading || followMutation.isPending}
                onClick={() => followMutation.mutate(!following)}
                className={following ? "border border-glass-border bg-glass text-foreground hover:bg-glass/80" : "bg-neon-purple text-primary-foreground hover:bg-neon-purple/90"}
              >
                {followMutation.isPending ? "Saving…" : following ? "Following" : "Follow"}
              </Button>
            ) : (
              <Link to="/auth"><Button className="bg-neon-purple text-primary-foreground hover:bg-neon-purple/90">Sign in to follow</Button></Link>
            )}
            <Button variant="outline" size="icon" className="border-glass-border bg-glass" onClick={() => { void navigator.clipboard?.writeText(window.location.href); toast.success("Profile link copied"); }}><Share2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <div className="mt-6 px-4">
        <h2 className="mb-3 text-lg font-bold text-foreground">Videos</h2>
        {videosQuery.isLoading && <p className="text-sm text-muted-foreground">Loading videos…</p>}
        {videosQuery.isError && <p className="text-sm text-destructive">Videos could not be loaded.</p>}
        {!videosQuery.isLoading && !videosQuery.isError && !videosQuery.data?.length && <p className="text-sm text-muted-foreground">This artist has not published any videos yet.</p>}
        <div className="space-y-3">
          {videosQuery.data?.map((video) => <ArtistVideoRow key={video.id} video={video} />)}
        </div>
      </div>
    </div>
  );
}

function ArtistVideoRow({ video }: { video: VideoWithArtist }) {
  return (
    <div className="group flex gap-3">
      <Link to="/videos/$id" params={{ id: video.id }} className="relative w-40 flex-shrink-0 overflow-hidden rounded-lg aspect-video video-card">
        {video.thumbnail_url ? <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center bg-deep-navy"><Music className="h-6 w-6 text-neon-purple" /></div>}
      </Link>
      <div className="flex-1 py-1">
        <Link to="/videos/$id" params={{ id: video.id }}><h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-neon-purple">{video.title}</h3></Link>
        <p className="mt-0.5 text-xs text-muted-foreground">{video.view_count.toLocaleString()} views</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return <div className="flex min-h-[70dvh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-purple border-t-transparent" /></div>;
}

function StateMessage({ title, message }: { title: string; message: string }) {
  return <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 px-6 text-center"><AlertCircle className="h-8 w-8 text-destructive" /><h1 className="text-lg font-semibold text-foreground">{title}</h1><p className="text-sm text-muted-foreground">{message}</p></div>;
}