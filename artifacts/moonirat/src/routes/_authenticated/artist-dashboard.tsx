import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BarChart3, Upload, Users, Eye, Music, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getArtistDashboard } from "@/lib/moonirat-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { videoPath } from "@/lib/video-links";

export const Route = createFileRoute("/_authenticated/artist-dashboard")({
  head: () => ({
    meta: [
      { title: "Artist Dashboard — Moonirat" },
      { name: "description", content: "Manage your artist profile and videos on Moonirat." },
    ],
  }),
  component: ArtistDashboardPage,
});

function ArtistDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dashboardQuery = useQuery({
    queryKey: ["artist-dashboard", user?.id],
    queryFn: () => getArtistDashboard(user!.id),
    enabled: Boolean(user?.id),
  });
  const deleteMutation = useMutation({
    mutationFn: async (video: {
      id: string;
      storage_path: string | null;
      thumbnail_storage_path: string | null;
    }) => {
      const removals = await Promise.all([
        video.storage_path
          ? supabase.storage.from("videos").remove([video.storage_path])
          : Promise.resolve({ error: null }),
        video.thumbnail_storage_path
          ? supabase.storage.from("thumbnails").remove([video.thumbnail_storage_path])
          : Promise.resolve({ error: null }),
      ]);
      const removalError = removals.find((result) => result.error)?.error;
      if (removalError) throw removalError;
      const result = await supabase.from("videos").delete().eq("id", video.id).eq("user_id", user!.id);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["artist-dashboard", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["home"] });
      void queryClient.invalidateQueries({ queryKey: ["discover"] });
      toast.success("Video deleted");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Video could not be deleted"),
  });
  if (dashboardQuery.isLoading) return <div className="flex min-h-[70dvh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-purple border-t-transparent" /></div>;
  if (dashboardQuery.isError) return <StateMessage title="Dashboard unavailable" message="Your artist data could not be loaded." error />;
  const dashboard = dashboardQuery.data;

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Artist Dashboard</h1>
        {!dashboard?.artist ? (
            <div className="mt-4 rounded-xl border border-glass-border bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 p-4">
            <div className="flex items-start gap-3">
              <Music className="mt-1 h-5 w-5 shrink-0 text-neon-purple" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground">Claim your artist page</h3>
                <p className="mt-1 text-xs text-muted-foreground">Artist identities are separate from user accounts. Find your existing artist page and verify it with at least one official X, Facebook, Instagram, or TikTok profile.</p>
                <Link to="/search" search={{ q: "" }}><Button size="sm" className="mt-4 bg-neon-purple hover:bg-neon-purple/90">Find my artist page</Button></Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Metric icon={<Eye className="h-5 w-5 text-neon-blue" />} value={dashboard.totalViews.toLocaleString()} label="Total Views" />
              <Metric icon={<Users className="h-5 w-5 text-neon-purple" />} value={dashboard.followerCount.toLocaleString()} label="Followers" />
              <Metric icon={<Music className="h-5 w-5 text-neon-blue" />} value={dashboard.videos.length.toString()} label="Videos" />
              <Metric icon={<BarChart3 className="h-5 w-5 text-neon-purple" />} value={dashboard.videos.length ? "Live" : "—"} label="Analytics" />
            </div>
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-foreground">My Videos</h2><Link to="/upload"><Button size="sm" className="bg-neon-purple hover:bg-neon-purple/90"><Upload className="mr-1 h-4 w-4" /> Upload</Button></Link></div>
              {dashboard.videos.length ? <div className="space-y-3">{dashboard.videos.map((video) => <div key={video.id} className="group flex gap-3"><Link to={videoPath(video)} className="relative w-40 flex-shrink-0 overflow-hidden rounded-lg aspect-video bg-deep-navy">{video.thumbnail_url ? <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Music className="h-6 w-6 text-neon-purple" /></div>}</Link><div className="min-w-0 flex-1 py-1"><Link to={videoPath(video)}><h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-neon-purple">{video.title}</h3></Link><p className="mt-0.5 text-xs text-muted-foreground">{video.view_count.toLocaleString()} views</p><Button variant="outline" size="sm" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm("Delete this published video?")) deleteMutation.mutate({ id: video.id, storage_path: video.storage_path, thumbnail_storage_path: video.thumbnail_storage_path }); }} className="mt-2 h-7 border-glass-border bg-glass text-xs text-destructive hover:bg-destructive/10">Delete</Button></div></div>)}</div> : <p className="py-10 text-center text-sm text-muted-foreground">You have not published any videos yet.</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <div className="rounded-xl border border-glass-border bg-glass p-4">{icon}<p className="mt-2 text-2xl font-bold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}

function StateMessage({ title, message, error = false }: { title: string; message: string; error?: boolean }) {
  return <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 px-6 text-center"><AlertCircle className={`h-8 w-8 ${error ? "text-destructive" : "text-muted-foreground"}`} /><h1 className="text-lg font-semibold text-foreground">{title}</h1><p className="text-sm text-muted-foreground">{message}</p></div>;
}