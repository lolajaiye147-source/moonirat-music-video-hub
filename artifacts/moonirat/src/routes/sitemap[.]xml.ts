import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

type PublicVideoSlug = {
  public_slug: string;
};

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { getServerConfig, getSupabaseServerConfig } = await import("@/lib/config.server");
        const { publicAppUrl } = getServerConfig();
        if (!publicAppUrl) {
          return new Response("Moonirat's public URL is not configured.", { status: 503 });
        }
        const { url: supabaseUrl, publishableKey } = getSupabaseServerConfig();
        const videoResponse = await fetch(
          `${supabaseUrl}/rest/v1/videos?select=public_slug&is_public=eq.true&order=created_at.desc&limit=1000`,
          {
            headers: {
              apikey: publishableKey,
              Authorization: `Bearer ${publishableKey}`,
            },
          },
        );
        if (!videoResponse.ok) {
          return new Response("Moonirat's public videos could not be indexed.", { status: 503 });
        }
        const videos = (await videoResponse.json()) as PublicVideoSlug[];
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/discover", changefreq: "daily", priority: "0.9" },
          { path: "/auth", changefreq: "monthly", priority: "0.3" },
          ...videos.map((video) => ({
            path: `/v/${encodeURIComponent(video.public_slug)}`,
            changefreq: "weekly" as const,
            priority: "0.8",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${new URL(e.path, publicAppUrl).toString()}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
