import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Clock3, CheckCircle2, AlertCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import {
  createFeedback,
  FEEDBACK_TYPES,
  getMyFeedback,
  type FeedbackStatus,
  type FeedbackType,
} from "@/lib/moonirat-data";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback — Moonirat" },
      { name: "description", content: "Share feedback and report issues to the Moonirat team." },
    ],
  }),
  component: FeedbackPage,
});

function FeedbackPage() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-[100dvh] pb-24">
      <div className="border-b border-glass-border bg-glass px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-purple/20">
            <MessageSquare className="h-5 w-5 text-neon-purple" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Beta feedback</h1>
            <p className="text-sm text-muted-foreground">Help us make Moonirat better.</p>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {isLoading ? (
          <LoadingState />
        ) : user ? (
          <AuthenticatedFeedback userId={user.id} />
        ) : (
          <SignedOutFeedback />
        )}
      </div>
    </div>
  );
}

function SignedOutFeedback() {
  return (
    <section className="rounded-2xl border border-glass-border bg-glass p-6 text-center">
      <MessageSquare className="mx-auto h-10 w-10 text-neon-purple/70" />
      <h2 className="mt-4 text-lg font-semibold text-foreground">Sign in to send feedback</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Create an account or sign in so we can keep your feedback private and show you its status.
      </p>
      <Link to="/auth">
        <Button className="mt-5 bg-neon-purple hover:bg-neon-purple/90">Sign in to continue</Button>
      </Link>
    </section>
  );
}

function AuthenticatedFeedback({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const requestKeyRef = useRef<string | null>(null);
  const [type, setType] = useState<FeedbackType>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const feedbackQuery = useQuery({
    queryKey: ["my-feedback", userId],
    queryFn: () => getMyFeedback(userId),
  });
  const submitMutation = useMutation({
    mutationFn: () =>
      createFeedback(userId, {
        submission_key: requestKeyRef.current ?? crypto.randomUUID(),
        type,
        subject,
        message,
      }),
    onSuccess: () => {
      requestKeyRef.current = null;
      setSubject("");
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: ["my-feedback", userId] });
      toast.success("Feedback submitted. Thank you for helping improve Moonirat.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Feedback could not be submitted.");
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    requestKeyRef.current ??= crypto.randomUUID();
    submitMutation.mutate();
  };

  return (
    <>
      <section className="rounded-2xl border border-glass-border bg-glass p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Send feedback</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us what happened or what would make Moonirat more useful.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Feedback type</Label>
            <select
              id="feedback-type"
              value={type}
              onChange={(event) => setType(event.target.value as FeedbackType)}
              className="flex h-10 w-full rounded-md border border-glass-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-neon-purple"
            >
              {FEEDBACK_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="feedback-subject">Subject</Label>
              <span className="text-xs text-muted-foreground">{subject.length}/160</span>
            </div>
            <Input
              id="feedback-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={160}
              required
              placeholder="Briefly describe your feedback"
              className="border-glass-border bg-background"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="feedback-message">Message</Label>
              <span className="text-xs text-muted-foreground">{message.length}/4000</span>
            </div>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={4000}
              required
              placeholder="What should we know?"
              className="min-h-32 border-glass-border bg-background"
            />
          </div>
          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full bg-neon-purple hover:bg-neon-purple/90"
          >
            <Send className="mr-2 h-4 w-4" />
            {submitMutation.isPending ? "Submitting…" : "Submit feedback"}
          </Button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-neon-blue" />
          <h2 className="text-lg font-semibold text-foreground">My feedback</h2>
        </div>
        {feedbackQuery.isLoading ? (
          <LoadingState />
        ) : feedbackQuery.isError ? (
          <StateMessage title="Feedback could not be loaded" message="Check your connection and try again." error />
        ) : feedbackQuery.data?.length ? (
          <div className="space-y-3">
            {feedbackQuery.data.map((submission) => (
              <FeedbackCard key={submission.id} submission={submission} />
            ))}
          </div>
        ) : (
          <StateMessage
            title="No feedback submitted yet"
            message="Your submissions and their updates will appear here."
          />
        )}
      </section>
    </>
  );
}

function FeedbackCard({
  submission,
}: {
  submission: {
    id: string;
    type: string;
    subject: string;
    message: string;
    status: string;
    priority: string;
    admin_response: string | null;
    created_at: string;
    status_updated_at: string;
  };
}) {
  return (
    <article className="rounded-xl border border-glass-border bg-glass p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neon-purple">
            {feedbackTypeLabel(submission.type)}
          </p>
          <h3 className="mt-1 font-semibold text-foreground">{submission.subject}</h3>
        </div>
        <StatusBadge status={submission.status} />
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{submission.message}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        Submitted {formatDate(submission.created_at)} · Updated {formatDate(submission.status_updated_at)}
      </p>
      {submission.admin_response && (
        <div className="mt-4 rounded-lg border border-neon-blue/20 bg-neon-blue/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neon-blue">Moonirat response</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{submission.admin_response}</p>
        </div>
      )}
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "resolved" || status === "closed"
      ? "default"
      : status === "reviewing" || status === "planned"
        ? "secondary"
        : "outline";
  return (
    <Badge variant={variant} className={status === "resolved" || status === "closed" ? "bg-neon-purple" : ""}>
      {statusLabel(status as FeedbackStatus)}
    </Badge>
  );
}

function feedbackTypeLabel(type: string) {
  return FEEDBACK_TYPES.find((item) => item.value === type)?.label ?? "Feedback";
}

function statusLabel(status: FeedbackStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function LoadingState() {
  return <p className="rounded-xl border border-glass-border bg-glass p-5 text-sm text-muted-foreground">Loading…</p>;
}

function StateMessage({ title, message, error = false }: { title: string; message: string; error?: boolean }) {
  return (
    <div className="rounded-xl border border-glass-border bg-glass p-6 text-center">
      {error ? <AlertCircle className="mx-auto h-8 w-8 text-destructive" /> : <CheckCircle2 className="mx-auto h-8 w-8 text-neon-purple/60" />}
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
    </div>
  );
}