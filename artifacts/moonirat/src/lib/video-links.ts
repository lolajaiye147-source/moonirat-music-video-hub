const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL?.trim() || "https://moonirat.com";

export type PublicVideoLink = {
  public_slug: string;
};

export function videoPath(video: PublicVideoLink) {
  return `/v/${encodeURIComponent(video.public_slug)}`;
}

export function videoUrl(video: PublicVideoLink) {
  return new URL(videoPath(video), PUBLIC_APP_URL).toString();
}