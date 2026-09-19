import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Music, CheckCircle, AlertCircle, Trash2, MessageSquare, Search, Save } from "lucide-react";
import { toast } from "sonner";
import {
  FEEDBACK_PRIORITIES,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPES,
  getAdminDashboard,
  reviewArtistClaim,
  setArtistVerified,
  type FeedbackPriority,
  type FeedbackStatus,
  type FeedbackSubmission,
  type FeedbackType,
} from "@/lib/moonirat-data";
import { removeVideoAsAdmin } from "@/lib/api/admin-moderation.functions";
import { listFeedbackAsAdmin, updateFeedbackAsAdmin } from "@/lib/api/admin-feedback.functions";
import { useAuth } from "@/lib/auth-context";

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
  const { isAdmin, session } = useAuth();
  const queryClient = useQueryClient();
  const [feedbackDraftSearch, setFeedbackDraftSearch] = useState("");
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus | "">("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType | "">("");
  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
    enabled: isAdmin,
  });
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
    mutationFn: (videoId: string) => {
      if (!session?.access_token) throw new Error("Your admin session expired.");
      return removeVideoAsAdmin({ data: { videoId, accessToken: session.access_token } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["home"] });
      void queryClient.invalidateQueries({ queryKey: ["discover"] });
      toast.success("Video removed");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Video could not be removed"),
  });
  const claimMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) =>
      reviewArtistClaim(id, decision),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Artist claim reviewed");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Artist claim could not be reviewed"),
  });
  const feedbackQuery = useQuery({
    queryKey: ["admin-feedback", feedbackSearch, feedbackStatus, feedbackType],
    queryFn: () => {
      if (!session?.access_token) throw new Error("Your admin session expired.");
      return listFeedbackAsAdmin({
        data: {
          accessToken: session.access_token,
          search: feedbackSearch || undefined,
          status: feedbackStatus || undefined,
          type: feedbackType || undefined,
        },
      });
    },
    enabled: isAdmin && Boolean(session?.access_token),
  });
  const feedbackMutation = useMutation({
    mutationFn: (data: {
      feedbackId: string;
      status: FeedbackStatus;
      priority: FeedbackPriority;
      adminResponse: string;
      adminNotes: string;
    }) => {
      if (!session?.access_token) throw new Error("Your admin session expired.");
      return updateFeedbackAsAdmin({ data: { accessToken: session.access_token, ...data } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
      toast.success("Feedback update saved");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Feedback update could not be saved"),
  });

  if (!isAdmin) {
    return (
      <StateMessage
        title="Admin access required"
        message="This area is only available to Moonirat administrators."
        error
      />
    );
  }
  if (dashboardQuery.isLoading) return <LoadingState />;
  if (dashboardQuery.isError || !dashboardQuery.data) return <StateMessage title="Admin dashboard unavailable" message="The moderation data could not be loaded. Confirm the account has an admin or moderator role." error />;
  const { users, pendingArtists, pendingClaims, videos } = dashboardQuery.data;

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
             <TabsTrigger value="feedback" className="flex-1 data-[state=active]:bg-neon-purple data-[state=active]:text-white">Feedback</TabsTrigger>
          </TabsList>
          <TabsContent value="artists" className="mt-4 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Ownership Claims ({pendingClaims.length})</h2>
            {pendingClaims.map((claim) => (
              <div key={claim.id} className="rounded-xl border border-neon-blue/30 bg-glass p-4">
                <h3 className="text-sm font-semibold text-foreground">{claim.artist?.name ?? "Unknown artist"}</h3>
                <p className="text-xs text-muted-foreground">Claimed by {claim.claimant?.display_name ?? claim.claimant?.username ?? "Unnamed user"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[["X", claim.x_url], ["Instagram", claim.instagram_url], ["Facebook", claim.facebook_url], ["TikTok", claim.tiktok_url]].filter((item): item is [string, string] => Boolean(item[1])).map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer" className="text-xs font-medium text-neon-blue hover:underline">{label}</a>)}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" disabled={claimMutation.isPending} onClick={() => claimMutation.mutate({ id: claim.id, decision: "approved" })} className="h-8 bg-neon-purple hover:bg-neon-purple/90">Approve</Button>
                  <Button size="sm" variant="outline" disabled={claimMutation.isPending} onClick={() => claimMutation.mutate({ id: claim.id, decision: "rejected" })} className="h-8 border-glass-border">Reject</Button>
                </div>
              </div>
            ))}
            {!pendingClaims.length && <p className="text-xs text-muted-foreground">No pending ownership claims.</p>}
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
           <TabsContent value="feedback" className="mt-4 space-y-4">
             <form
               className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]"
               onSubmit={(event) => {
                 event.preventDefault();
                 setFeedbackSearch(feedbackDraftSearch.trim());
               }}
             >
               <div className="relative">
                 <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                 <Input
                   value={feedbackDraftSearch}
                   onChange={(event) => setFeedbackDraftSearch(event.target.value)}
                   placeholder="Search subject or message"
                   className="border-glass-border bg-glass pl-9"
                   maxLength={100}
                 />
               </div>
               <select value={feedbackStatus} onChange={(event) => setFeedbackStatus(event.target.value as FeedbackStatus | "")} className="h-10 rounded-md border border-glass-border bg-glass px-3 text-sm text-foreground">
                 <option value="">All statuses</option>
                 {FEEDBACK_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
               </select>
               <select value={feedbackType} onChange={(event) => setFeedbackType(event.target.value as FeedbackType | "")} className="h-10 rounded-md border border-glass-border bg-glass px-3 text-sm text-foreground">
                 <option value="">All types</option>
                 {FEEDBACK_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
               </select>
               <Button type="submit" variant="outline" className="border-glass-border bg-glass">Search</Button>
             </form>
             {feedbackQuery.isLoading ? (
               <LoadingState />
             ) : feedbackQuery.isError ? (
               <StateMessage title="Feedback unavailable" message="The feedback queue could not be loaded." error />
             ) : feedbackQuery.data?.length ? (
               <div className="space-y-3">
                 {feedbackQuery.data.map((submission) => (
                   <FeedbackReviewCard
                     key={submission.id}
                     submission={submission}
                     isSaving={feedbackMutation.isPending}
                     onSave={(data) => feedbackMutation.mutate(data)}
                   />
                 ))}
               </div>
             ) : (
               <EmptyState icon={<MessageSquare className="h-8 w-8 text-muted-foreground" />} message="No feedback submissions found" />
             )}
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

function FeedbackReviewCard({
  submission,
  isSaving,
  onSave,
}: {
  submission: FeedbackSubmission;
  isSaving: boolean;
  onSave: (data: {
    feedbackId: string;
    status: FeedbackStatus;
    priority: FeedbackPriority;
    adminResponse: string;
    adminNotes: string;
  }) => void;
}) {
  const [status, setStatus] = useState<FeedbackStatus>(submission.status);
  const [priority, setPriority] = useState<FeedbackPriority>(submission.priority);
  const [adminResponse, setAdminResponse] = useState(submission.admin_response ?? "");
  const [adminNotes, setAdminNotes] = useState(submission.admin_notes ?? "");

  useEffect(() => {
    setStatus(submission.status);
    setPriority(submission.priority);
    setAdminResponse(submission.admin_response ?? "");
    setAdminNotes(submission.admin_notes ?? "");
  }, [submission]);

  return (
    <article className="rounded-xl border border-glass-border bg-glass p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-neon-purple">{feedbackTypeLabel(submission.type)}</p>
          <h3 className="mt-1 text-sm font-semibold text-foreground">{submission.subject}</h3>
          <p className="mt-1 text-xs text-muted-foreground">User {submission.user_id.slice(0, 8)} · {formatDate(submission.created_at)}</p>
        </div>
        <Badge variant="outline">{submission.status}</Badge>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{submission.message}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as FeedbackStatus)} className="h-10 w-full rounded-md border border-glass-border bg-background px-3 text-sm font-normal text-foreground">
            {FEEDBACK_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Priority
          <select value={priority} onChange={(event) => setPriority(event.target.value as FeedbackPriority)} className="h-10 w-full rounded-md border border-glass-border bg-background px-3 text-sm font-normal text-foreground">
            {FEEDBACK_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 space-y-3">
        <label className="block space-y-1 text-xs font-medium text-muted-foreground">
          User-visible response
          <Textarea value={adminResponse} onChange={(event) => setAdminResponse(event.target.value)} maxLength={4000} className="min-h-20 border-glass-border bg-background text-sm text-foreground" placeholder="Share an update with the user" />
        </label>
        <label className="block space-y-1 text-xs font-medium text-muted-foreground">
          Internal admin notes
          <Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} maxLength={4000} className="min-h-20 border-glass-border bg-background text-sm text-foreground" placeholder="Keep internal review context here" />
        </label>
      </div>
      <Button
        type="button"
        onClick={() => onSave({ feedbackId: submission.id, status, priority, adminResponse, adminNotes })}
        disabled={isSaving}
        className="mt-4 bg-neon-purple hover:bg-neon-purple/90"
      >
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Saving…" : "Save feedback update"}
      </Button>
    </article>
  );
}

function feedbackTypeLabel(type: string) {
  return FEEDBACK_TYPES.find((item) => item.value === type)?.label ?? "Feedback";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}