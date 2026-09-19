const PLAYER_QUEUE_KEY = "moonirat:player-queue:v1";

export type PlayerQueue = {
  ids: string[];
  source: string;
};

export function setPlayerQueue(ids: string[], source: string) {
  if (typeof window === "undefined") return;
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return;
  sessionStorage.setItem(PLAYER_QUEUE_KEY, JSON.stringify({ ids: uniqueIds, source }));
}

export function getPlayerQueue(currentVideoId: string): PlayerQueue | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(sessionStorage.getItem(PLAYER_QUEUE_KEY) ?? "null") as
      | PlayerQueue
      | null;
    if (!value || !Array.isArray(value.ids) || !value.ids.includes(currentVideoId)) return null;
    return { ids: value.ids.filter((id) => typeof id === "string"), source: value.source };
  } catch {
    return null;
  }
}