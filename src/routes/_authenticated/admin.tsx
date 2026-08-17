import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Music, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getAdminDashboard, removeVideoAsAdmin, setArtistVerified } from "@/lib/moonirat-data";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Moonirat" },
      { name: "description", content: "Moonirat admin dashboard." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const dashboardQuery = useQuery({ queryKey: ["admin-dashboard"], queryFn: getAdminDashboard });
  const verificationMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) => setArtistVerified(id, verified),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["home", "artists"] });
      void queryClient.invalidateQueries({ queryKey: ["discover", "artists"] });
      toast.success("Artist verification updated");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Artist verification could not be updated"),
  });
  const removeMutation = useMutation({
    mutationFn: removeVideoAsAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["home"] });
      void queryClient.invalidateQueries({ queryKey: ["discover"] });
      toast.success("Video removed");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Video could not be removed"),
  });

  if (dashboardQuery.isLoading) return <LoadingState />;
  if (dashboardQuery.isError || !dashboardQuery.data) return <StateMessage title="Admin dashboard unavailable" message="The moderation data could not be loaded. Confirm the account has an admin or moderator role." error />;
  const { users, pendingArtists, videos } = dashboardQuery.data;

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="px-4 py-4">
        <div className="mb-6 flex items-center gap-2"><Shield className="h-6 w-6 text-neon-blue" /><h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1></div>
        <div className="mb-6 grid grid-cols-2 gap-3">
          <Metric icon={<Users className="h-5 w-5 text-neon-purple" />} value={users.length.toLocaleString()} label="Total Users" />
          <Metric icon={<Music className="h-5 w-5 text-neon-blue" />} value={videos.length.toLocaleString()} label="Total Videos" />
        </div>
        <Tabs defaultValue="artists" className="w-full">
          <TabsList className="w-full border border-glass-border bg-glass">
            <TabsTrigger value="artists" className="flex-1 data-[state=active]:bg-neon-purple data-[state=active]:text-white">Artists</TabsTrigger>
            <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-neon-purple data-[state=active]:text-white">Users</TabsTrigger>
            <TabsTrigger value="videos" className="flex-1 data-[state=active]:bg-neon-purple data-[state=active]:text-white">Videos</TabsTrigger>
          </TabsList>
          <TabsContent value="artists" className="mt-4 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Pending Verification ({pendingArtists.length})</h2>
            {pendingArtists.map((artist) => (
              <div key={artist.id} className="rounded-xl border border-glass-border bg-glass p-4">
                <div className="flex items-center justify-between gap-3">
                  <div><h3 className="text-sm font-semibold text-foreground">{artist.name}</h3><p className="text-xs text-muted-foreground">{artist.profile?.display_name ?? artist.profile?.username ?? "No profile name"}</p><p className="text-xs text-muted-foreground">Requested {new Date(artist.created_at).toLocaleDateString()}</p></div>
                  <Button size="sm" disabled={verificationMutation.isPending} onClick={() => verificationMutation.mutate({ id: artist.id, verified: true })} className="h-8 bg-neon-purple hover:bg-neon-purple/90"><CheckCircle className="mr-1 h-3.5 w-3.5" /> Verify</Button>
                </div>
              </div>
            ))}
            {!pendingArtists.length && <EmptyState icon={<CheckCircle className="h-8 w-8 text-neon-purple/50" />} message="No pending artist applications" />}
          </TabsContent>
          <TabsContent value="users" className="mt-4 space-y-3">
            {users.map((user) => <div key={user.id} className="flex items-center justify-between rounded-xl border border-glass-border bg-glass p-4"><div><h3 className="text-sm font-semibold text-foreground">{user.displayName ?? (user.username ? `@${user.username}` : "Unnamed user")}</h3><p className="text-xs text-muted-foreground">Joined {new Date(user.joinedAt).toLocaleDateString()}</p></div><div className="flex gap-1">{user.roles.length ? user.roles.map((role) => <Badge key={role} variant={role === "admin" ? "default" : "secondary"} className={role === "admin" ? "bg-neon-purple" : ""}>{role}</Badge>) : <Badge variant="secondary">user</Badge>}</div></div>)}
            {!users.length && <EmptyState icon={<Users className="h-8 w-8 text-muted-foreground" />} message="No user profiles found" />}
          </TabsContent>
          <TabsContent value="videos" className="mt-4 space-y-3">
            {videos.map((video) => <div key={video.id} className="flex items-center justify-between rounded-xl border border-glass-border bg-glass p-4"><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-foreground">{video.title}</h3><p className="text-xs text-muted-foreground">{video.artists?.name ?? "Unknown artist"} · {video.is_public ? "Public" : "Private"}</p></div><Button size="sm" variant="outline" disabled={removeMutation.isPending} onClick={() => { if (window.confirm("Remove this video?")) removeMutation.mutate(video.id); }} className="ml-3 h-7 border-glass-border bg-glass text-xs text-destructive hover:bg-destructive/10"><Trash2 className="mr-1 h-3.5 w-3.5" /> Remove</Button></div>)}
            {!videos.length && <EmptyState icon={<Music className="h-8 w-8 text-muted-foreground" />} message="No videos found" />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <div className="rounded-xl border border-glass-border bg-glass p-4">{icon}<p className="mt-2 text-2xl font-bold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return <div className="py-8 text-center">{icon}<p className="mt-2 text-sm text-muted-foreground">{message}</p></div>;
}

function LoadingState() {
  return <div className="flex min-h-[70dvh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-purple border-t-transparent" /></div>;
}

function StateMessage({ title, message, error = false }: { title: string; message: string; error?: boolean }) {
  return <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 px-6 text-center"><AlertCircle className={`h-8 w-8 ${error ? "text-destructive" : "text-muted-foreground"}`} /><h1 className="text-lg font-semibold text-foreground">{title}</h1><p className="text-sm text-muted-foreground">{message}</p></div>;
}