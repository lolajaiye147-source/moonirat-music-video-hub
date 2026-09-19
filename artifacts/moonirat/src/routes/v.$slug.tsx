import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getVideoByPublicSlug } from "@/lib/moonirat-data";
import { videoUrl } from "@/lib/video-links";
import { VideoPage } from "./videos.$id";

export const Route = createFileRoute("/v/$slug")({
  loader: async ({ params }) => getVideoByPublicSlug(params.slug),
  head: ({ loaderData }) => {
    const video = loaderData;
    const title = video ? `${video.title} — ${video.artists?.name ?? "Moonirat"}` : "Video — Moonirat";
    const canonical = video ? videoUrl(video) : undefined;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: video?.description || `Watch ${video?.title ?? "music videos"} on Moonirat.`,
        },
        { property: "og:title", content: title },
        ...(canonical ? [{ property: "og:url", content: canonical }] : []),
      ],
      links: canonical ? [{ rel: "canonical", href: canonical }] : [],
    };
  },
  component: PublicVideoPage,
});

function PublicVideoPage() {
  const video = Route.useLoaderData();
  return video ? <VideoPage videoId={video.id} /> : <VideoPage videoId="" />;
}