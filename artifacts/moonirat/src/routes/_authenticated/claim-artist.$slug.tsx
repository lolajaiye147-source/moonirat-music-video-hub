import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import {
  getArtist,
  getMyArtistClaim,
  submitArtistClaim,
  type ArtistClaim,
} from "@/lib/moonirat-data";

export const Route = createFileRoute("/_authenticated/claim-artist/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Claim ${params.slug} — Moonirat` },
      { name: "description", content: "Claim an artist page using an official social profile." },
    ],
  }),
  component: ClaimArtistPage,
});

const socialFields = [
  { key: "x_url", label: "X profile", placeholder: "https://x.com/artist" },
  { key: "instagram_url", label: "Instagram profile", placeholder: "https://instagram.com/artist" },
  { key: "facebook_url", label: "Facebook page", placeholder: "https://facebook.com/artist" },
  { key: "tiktok_url", label: "TikTok profile", placeholder: "https://tiktok.com/@artist" },
] as const;

type SocialLinks = Pick<ArtistClaim, (typeof socialFields)[number]["key"]>;

function normalizedSocialUrl(value: string, key: keyof SocialLinks) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const url = new URL(trimmed);
  if (url.protocol !== "https:") throw new Error("Social links must start with https://");
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const allowed: Record<keyof SocialLinks, string[]> = {
    x_url: ["x.com", "twitter.com"],
    instagram_url: ["instagram.com"],
    facebook_url: ["facebook.com"],
    tiktok_url: ["tiktok.com"],
  };
  if (!allowed[key].includes(host)) throw new Error(`Enter the official ${socialFields.find((field) => field.key === key)?.label}.`);
  return url.toString();
}

function ClaimArtistPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [links, setLinks] = useState<Record<keyof SocialLinks, string>>({
    x_url: "",
    instagram_url: "",
    facebook_url: "",
    tiktok_url: "",
  });
  const artistQuery = useQuery({ queryKey: ["artist", slug], queryFn: () => getArtist(slug) });
  const artist = artistQuery.data;
  const claimQuery = useQuery({
    queryKey: ["artist-claim", user?.id, artist?.id],
    queryFn: () => getMyArtistClaim(user!.id, artist!.id),
    enabled: Boolean(user?.id && artist?.id),
  });
  const claimMutation = useMutation({
    mutationFn: (socialLinks: SocialLinks) => submitArtistClaim(user!.id, artist!.id, socialLinks),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["artist-claim", user?.id, artist?.id] });
      toast.success("Artist claim submitted for review");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Claim could not be submitted"),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const normalized = Object.fromEntries(
        socialFields.map(({ key }) => [key, normalizedSocialUrl(links[key], key)]),
      ) as SocialLinks;
      if (!Object.values(normalized).some(Boolean)) throw new Error("Add at least one official social profile.");
      claimMutation.mutate(normalized);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Check the social links.");
    }
  };

  if (artistQuery.isLoading || claimQuery.isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Loading artist claim…</div>;
  if (!artist) return <div className="p-8 text-center text-sm text-destructive">Artist page not found.</div>;
  if (artist.user_id) return <ClaimState title="This artist page is already claimed" message="Only unclaimed artist pages can receive ownership claims." slug={slug} />;
  if (claimQuery.data) {
    const claim = claimQuery.data;
    return <ClaimState title={`Claim ${claim.status}`} message={claim.status === "pending" ? "A Moonirat administrator will compare your social profile with this artist page." : claim.review_note || "You can contact Moonirat if you need more information."} slug={slug} />;
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-xl px-4 py-8 pb-24">
      <BadgeCheck className="h-9 w-9 text-neon-blue" />
      <h1 className="mt-3 text-2xl font-bold text-foreground">Claim {artist.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Add at least one official social profile. An administrator will review it before connecting this artist page to your account.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-glass-border bg-glass p-4">
        {socialFields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input id={field.key} type="url" value={links[field.key]} onChange={(event) => setLinks((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder} className="border-glass-border bg-background/60" />
          </div>
        ))}
        <Button type="submit" disabled={claimMutation.isPending} className="w-full bg-neon-purple hover:bg-neon-purple/90">
          {claimMutation.isPending ? "Submitting…" : "Submit artist claim"}
        </Button>
      </form>
      <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><ExternalLink className="h-3 w-3" /> Links must point to X, Facebook, Instagram, or TikTok.</p>
    </div>
  );
}

function ClaimState({ title, message, slug }: { title: string; message: string; slug: string }) {
  return <div className="mx-auto min-h-[70dvh] max-w-lg px-4 py-16 text-center"><BadgeCheck className="mx-auto h-10 w-10 text-neon-blue" /><h1 className="mt-4 text-xl font-bold text-foreground">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{message}</p><Link to="/artists/$slug" params={{ slug }}><Button className="mt-5 bg-neon-purple hover:bg-neon-purple/90">Back to artist</Button></Link></div>;
}