import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/VideoCard";
import { ArtistCard } from "@/components/ArtistCard";
import { TrendingUp, Flame, Star, ChevronRight, Play, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getFeaturedArtists, getNewReleases, getPublicVideos, type VideoWithArtist } from "@/lib/moonirat-data";
import { setPlayerQueue } from "@/lib/player-queue";
import { videoPath } from "@/lib/video-links";

const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
const HOME_URL = PUBLIC_APP_URL ? new URL("/", PUBLIC_APP_URL).toString() : undefined;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moonirat — The Home of Music Videos" },
      { name: "description", content: "Discover music videos from emerging artists. Stream, follow, and create playlists on Moonirat." },
      { property: "og:title", content: "Moonirat — The Home of Music Videos" },
      { property: "og:description", content: "Discover music videos from emerging artists. Stream, follow, and create playlists on Moonirat." },
      ...(HOME_URL ? [{ property: "og:url", content: HOME_URL }] : []),
    ],
    links: HOME_URL ? [{ rel: "canonical", href: HOME_URL }] : [],
  }),
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();
  const trendingQuery = useQuery({ queryKey: ["home", "trending"], queryFn: () => getPublicVideos({ limit: 12 }) });
  const releasesQuery = useQuery({ queryKey: ["home", "new-releases"], queryFn: () => getNewReleases({ limit: 12 }) });
  const artistsQuery = useQuery({ queryKey: ["home", "artists"], queryFn: () => getFeaturedArtists(12) });
  const featuredVideo = trendingQuery.data?.[0];

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-purple/20"><TrendingUp className="h-4 w-4 text-neon-purple" /></div>
          <h1 className="text-lg font-bold tracking-tight"><span className="text-gradient">Moonirat</span></h1>
        </div>
         <div className="flex items-center gap-2">
           <Link to="/feedback" className="text-xs font-medium text-neon-purple hover:text-neon-purple/80">Feedback</Link>
           {!user && <Link to="/auth"><Button size="sm" className="h-8 bg-neon-purple text-xs hover:bg-neon-purple/90">Sign In</Button></Link>}
         </div>
      </div>

      {trendingQuery.isLoading ? (
        <div className="mx-4 mt-2 flex aspect-video items-center justify-center rounded-2xl bg-glass"><div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-purple border-t-transparent" /></div>
      ) : featuredVideo ? (
        <div className="relative mx-4 mt-2 aspect-video overflow-hidden rounded-2xl bg-deep-navy">
          {featuredVideo.thumbnail_url ? <img src={featuredVideo.thumbnail_url} alt={featuredVideo.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Play className="h-12 w-12 text-neon-purple/60" /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="mb-2 flex items-center gap-2"><Flame className="h-4 w-4 text-neon-purple" /><span className="text-xs font-medium text-neon-purple">Trending now</span></div>
            <h2 className="text-xl font-bold text-white">{featuredVideo.title}</h2>
            <p className="text-sm text-white/80">{featuredVideo.artists?.name ?? "Unknown artist"}</p>
            <Link to={videoPath(featuredVideo)} onClick={() => setPlayerQueue((trendingQuery.data ?? []).map((video) => video.id), "Home trending")}><Button className="mt-3 bg-neon-purple text-white hover:bg-neon-purple/90"><Play className="mr-2 h-4 w-4" fill="white" /> Watch Now</Button></Link>
          </div>
        </div>
      ) : trendingQuery.isError ? (
        <StateMessage title="Moonirat is unavailable right now" message="We couldn't load public videos. Please try again later." error />
      ) : (
        <StateMessage title="No videos yet" message="Artists have not published any public videos yet." />
      )}

      <div className="space-y-8 px-4 py-4">
        <HomeVideoSection title="Trending" icon={<Flame className="h-5 w-5 text-neon-purple" />} videos={trendingQuery.data ?? []} isLoading={trendingQuery.isLoading} isError={trendingQuery.isError} />
        <section>
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Star className="h-5 w-5 text-neon-blue" /><h2 className="text-lg font-bold text-foreground">Featured Artists</h2></div><Link to="/discover" className="flex items-center text-xs font-medium text-neon-purple">See All <ChevronRight className="ml-0.5 h-3 w-3" /></Link></div>
          {artistsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading artists…</p> : artistsQuery.isError ? <p className="text-sm text-destructive">Artists could not be loaded.</p> : artistsQuery.data?.length ? <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">{artistsQuery.data.map((artist) => <div key={artist.id} className="flex-shrink-0"><ArtistCard slug={artist.slug} name={artist.name} profileImageUrl={artist.profile_image_url} verified={artist.verified} /></div>)}</div> : <p className="text-sm text-muted-foreground">No featured artists yet.</p>}
        </section>
        <HomeVideoSection title="New Releases" icon={<TrendingUp className="h-5 w-5 text-neon-blue" />} videos={releasesQuery.data ?? []} isLoading={releasesQuery.isLoading} isError={releasesQuery.isError} />
        <div className="py-6 text-center"><p className="text-sm italic text-muted-foreground">"Moonirat — The Home of Music Videos"</p></div>
      </div>
    </div>
  );
}

function HomeVideoSection({ title, icon, videos, isLoading, isError }: { title: string; icon: React.ReactNode; videos: VideoWithArtist[]; isLoading: boolean; isError: boolean }) {
  return <section><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2">{icon}<h2 className="text-lg font-bold text-foreground">{title}</h2></div><Link to="/discover" className="flex items-center text-xs font-medium text-neon-purple">See All <ChevronRight className="ml-0.5 h-3 w-3" /></Link></div>{isLoading ? <p className="text-sm text-muted-foreground">Loading videos…</p> : isError ? <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" /> This section could not be loaded.</div> : videos.length ? <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">{videos.map((video) => <VideoCard key={video.id} id={video.id} publicSlug={video.public_slug} title={video.title} artistName={video.artists?.name ?? "Unknown artist"} thumbnailUrl={video.thumbnail_url} duration={video.duration} viewCount={video.view_count} queueIds={videos.map((item) => item.id)} queueSource={`Home ${title}`} />)}</div> : <p className="text-sm text-muted-foreground">No videos available yet.</p>}</section>;
}

function StateMessage({ title, message, error = false }: { title: string; message: string; error?: boolean }) {
  return <div className="mx-4 mt-2 flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl bg-glass px-6 text-center"><AlertCircle className={`h-8 w-8 ${error ? "text-destructive" : "text-muted-foreground"}`} /><h2 className="font-semibold text-foreground">{title}</h2><p className="text-sm text-muted-foreground">{message}</p></div>;
}