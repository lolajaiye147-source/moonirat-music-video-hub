import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Eye, EyeOff, Music2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Moonirat" },
      {
        name: "description",
        content:
          "Sign in to Moonirat to discover music videos, follow artists, and create playlists.",
      },
    ],
  }),
  component: AuthPage,
});

function getSignupErrorMessage(error: Error) {
  if (/auth email is not configured/i.test(error.message)) {
    return "Account email delivery is temporarily unavailable. Please try again shortly.";
  }
  if (/Resend rejected the auth email/i.test(error.message)) {
    return "We could not send your verification email. No account was created; please try again shortly.";
  }
  return error.message;
}

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const submitInFlightRef = useRef(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      void navigate({ to: "/", replace: true });
    }
  }, [navigate, user]);

  if (user) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitInFlightRef.current) return;

    if (!isLogin) {
      const trimmedDisplayName = displayName.trim();
      const trimmedEmail = email.trim();
      if (!trimmedDisplayName) {
        toast.error("Display name is required");
        return;
      }
      if (!trimmedEmail) {
        toast.error("Email is required");
        return;
      }
      if (!password) {
        toast.error("Password is required");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      submitInFlightRef.current = true;
      setIsLoading(true);
      submitButtonRef.current?.setAttribute("disabled", "");
      setSignupMessage(null);
      try {
        const { error, session, message } = await signUp(trimmedEmail, password, trimmedDisplayName);
        if (error) {
          const message = getSignupErrorMessage(error);
          toast.error(message);
          setSignupMessage(message);
        } else if (session) {
          toast.success("Account created! Welcome to Moonirat.");
          navigate({ to: "/" });
        } else {
          setSignupMessage(message ?? "Check your email to verify your Moonirat account.");
          setPassword("");
          setConfirmPassword("");
        }
      } finally {
        submitInFlightRef.current = false;
        submitButtonRef.current?.removeAttribute("disabled");
        setIsLoading(false);
      }
      return;
    }

    submitInFlightRef.current = true;
    setIsLoading(true);
    submitButtonRef.current?.setAttribute("disabled", "");
    setSignupMessage(null);
    setLoginMessage(null);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
        setLoginMessage("Email or password is incorrect.");
      } else {
        toast.success("Welcome back!");
        navigate({ to: "/" });
      }
    } finally {
      submitInFlightRef.current = false;
      submitButtonRef.current?.removeAttribute("disabled");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neon-purple/20">
            <Music2 className="h-8 w-8 text-neon-purple" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isLogin ? "Welcome back" : "Join Moonirat"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin
              ? "Sign in to discover music videos"
              : "Create your account and start discovering music."}
          </p>
        </div>

        {signupMessage && (
          <div
            className="mb-4 rounded-lg border border-neon-purple/30 bg-neon-purple/10 p-3 text-sm text-foreground"
            role="alert"
          >
            {signupMessage}
          </div>
        )}
        {loginMessage && (
          <div
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-foreground"
            role="alert"
          >
            {loginMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="display-name" className="text-sm font-medium">
                Display name
              </Label>
              <Input
                id="display-name"
                autoComplete="name"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="bg-glass border-glass-border"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-glass border-glass-border"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              {isLogin && (
                <Link
                  to="/reset-password"
                  className="text-xs text-neon-purple hover:text-neon-purple/80"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder={isLogin ? "••••••••" : "Create a password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-glass border-glass-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-glass border-glass-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <Button
            ref={submitButtonRef}
            type="submit"
            disabled={isLoading}
            className="w-full bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground font-semibold h-11"
          >
            {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-neon-purple hover:text-neon-purple/80 font-medium"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
