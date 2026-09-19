import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { requestPasswordResetWithAuthEmail } from "@/lib/api/auth-email.functions";
import { ArrowLeft, KeyRound } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Moonirat" },
      { name: "description", content: "Reset your Moonirat password." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"request" | "reset">("request");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if we're in recovery mode (user clicked email link)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setMode("reset");
    }
  }, []);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      await requestPasswordResetWithAuthEmail({ data: { email } });
      const message = "If an account exists for that email, a reset link has been sent.";
      setStatusMessage(message);
      toast.success(message);
    } catch (error) {
      const message =
        error instanceof Error && /too many email requests/i.test(error.message)
          ? "Too many email requests. Please wait 15 minutes and try again."
          : "We could not send the reset email. Please try again shortly.";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      navigate({ to: "/auth" });
    }
    setIsLoading(false);
  }

  if (user && mode === "request") {
    navigate({ to: "/", replace: true });
    return null;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate({ to: "/auth" })}
          className="mb-6 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to sign in
        </button>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neon-purple/20">
            <KeyRound className="h-8 w-8 text-neon-purple" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {mode === "request" ? "Forgot password?" : "Set new password"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "request"
              ? "Enter your email and we'll send you a reset link"
              : "Enter your new password below"}
          </p>
        </div>
        {statusMessage && (
          <div
            className="mb-4 rounded-lg border border-neon-purple/30 bg-neon-purple/10 p-3 text-sm text-foreground"
            role="status"
          >
            {statusMessage}
          </div>
        )}

        {mode === "request" ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-glass border-glass-border"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground font-semibold h-11"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-glass border-glass-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-glass border-glass-border"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground font-semibold h-11"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
