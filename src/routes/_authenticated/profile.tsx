import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { Camera, Settings, Music, Heart, Users, LogOut, ChevronRight, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.username || "");
  const [bio, setBio] = useState("");

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  const handleSaveProfile = async () => {
    // In a real app, this would update the profiles table
    toast.success("Profile updated");
    setIsEditing(false);
  };

  return (
    <div className="min-h-[100dvh] pb-20">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Profile</h1>

        {/* Profile Header */}
        <div className="mt-6 flex flex-col items-center">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-neon-purple">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-neon-purple/20 text-neon-purple text-2xl font-bold">
                {(user?.user_metadata?.username || user?.email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-neon-purple text-white">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-3 text-lg font-bold text-foreground">
            {user?.user_metadata?.username || user?.email?.split("@")[0] || "User"}
          </h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-glass p-3 text-center border border-glass-border">
            <Music className="mx-auto h-5 w-5 text-neon-purple" />
            <p className="mt-1 text-lg font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Videos</p>
          </div>
          <div className="rounded-xl bg-glass p-3 text-center border border-glass-border">
            <Heart className="mx-auto h-5 w-5 text-neon-blue" />
            <p className="mt-1 text-lg font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Favorites</p>
          </div>
          <div className="rounded-xl bg-glass p-3 text-center border border-glass-border">
            <Users className="mx-auto h-5 w-5 text-neon-purple" />
            <p className="mt-1 text-lg font-bold text-foreground">0</p>
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
              <Label>Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                className="bg-glass border-glass-border min-h-[80px]"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveProfile} className="flex-1 bg-neon-purple hover:bg-neon-purple/90">Save</Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" className="border-glass-border bg-glass">Cancel</Button>
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
          <Link to="/_authenticated/artist-dashboard" className="flex items-center justify-between rounded-xl bg-glass p-4 border border-glass-border hover:bg-glass/80 transition-colors">
            <div className="flex items-center gap-3">
              <Music className="h-5 w-5 text-neon-purple" />
              <span className="text-sm font-medium text-foreground">Artist Dashboard</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          {isAdmin && (
            <Link to="/_authenticated/admin" className="flex items-center justify-between rounded-xl bg-glass p-4 border border-glass-border hover:bg-glass/80 transition-colors">
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
