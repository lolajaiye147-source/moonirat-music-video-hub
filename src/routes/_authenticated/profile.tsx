import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useRef, useState } from "react";
import { Camera, Settings, Music, Heart, Users, LogOut, ChevronRight, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProfile,
  getArtistDashboard,
  getFollowingCount,
  updateProfile,
} from "@/lib/moonirat-data";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Moonirat" },
      { name: "description", content: "Your Moonirat profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: Boolean(user?.id),
  });
  const artistQuery = useQuery({
    queryKey: ["artist", "current", user?.id],
    queryFn: () => getArtistDashboard(user!.id),
    enabled: Boolean(user?.id),
  });
  const followingQuery = useQuery({
    queryKey: ["following-count", user?.id],
    queryFn: () => getFollowingCount(user!.id),
    enabled: Boolean(user?.id),
  });
  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setUsername(profile.username ?? "");
    setBio(profile.bio ?? "");
    setAvatarUrl(profile.avatar_url);
  }, [profileQuery.data]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const saved = await updateProfile(user.id, {
        display_name: displayName.trim() || null,
        username: username.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      });
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      queryClient.setQueryData(["profile", user.id], saved);
      toast.success("Profile updated");
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile could not be saved");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Avatar must be less than 10MB.");
      return;
    }
    setIsUploadingAvatar(true);
    const path = `${user.id}/avatar-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    try {
      const upload = await supabase.storage
        .from("thumbnails")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upload.error) throw upload.error;
      const { data } = supabase.storage.from("thumbnails").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      toast.success("Avatar uploaded. Save your profile to keep it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Avatar upload failed");
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
        {profileQuery.isLoading && (
          <p className="mt-6 text-sm text-muted-foreground">Loading your profile…</p>
        )}
        {profileQuery.isError && (
          <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Your profile could not be loaded. Refresh and try again.
          </p>
        )}

        {/* Profile Header */}
        <div className="mt-6 flex flex-col items-center" aria-busy={profileQuery.isLoading}>
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-neon-purple">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="bg-neon-purple/20 text-neon-purple text-2xl font-bold">
                {(displayName || username || user?.email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarSelect}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-neon-purple text-white disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-3 text-lg font-bold text-foreground">
            {displayName || username || user?.email?.split("@")[0] || "User"}
          </h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-glass p-3 text-center border border-glass-border">
            <Music className="mx-auto h-5 w-5 text-neon-purple" />
            <p className="mt-1 text-lg font-bold text-foreground">
              {artistQuery.data?.videos.length ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Videos</p>
          </div>
          <div className="rounded-xl bg-glass p-3 text-center border border-glass-border">
            <Heart className="mx-auto h-5 w-5 text-neon-blue" />
            <p className="mt-1 text-lg font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Favorites</p>
          </div>
          <div className="rounded-xl bg-glass p-3 text-center border border-glass-border">
            <Users className="mx-auto h-5 w-5 text-neon-purple" />
            <p className="mt-1 text-lg font-bold text-foreground">{followingQuery.data ?? 0}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
        </div>

        {/* Edit Profile */}
        {isEditing ? (
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-glass border-glass-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-glass border-glass-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                className="bg-glass border-glass-border min-h-[80px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 bg-neon-purple hover:bg-neon-purple/90"
              >
                {isSaving ? "Saving…" : "Save"}
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="border-glass-border bg-glass"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="mt-6 w-full border-glass-border bg-glass"
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}

        {/* Menu */}
        <div className="mt-6 space-y-1">
          <Link
            to="/artist-dashboard"
            className="flex items-center justify-between rounded-xl bg-glass p-4 border border-glass-border hover:bg-glass/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Music className="h-5 w-5 text-neon-purple" />
              <span className="text-sm font-medium text-foreground">Artist Dashboard</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center justify-between rounded-xl bg-glass p-4 border border-glass-border hover:bg-glass/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-neon-blue" />
                <span className="text-sm font-medium text-foreground">Admin Panel</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}
        </div>

        {/* Sign Out */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="mt-6 w-full border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
