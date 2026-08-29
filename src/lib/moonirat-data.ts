import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Artist = Tables<"artists">;
export type Video = Tables<"videos">;
export type Profile = Tables<"profiles">;
export type Playlist = Tables<"playlists">;
export type PlaylistVideo = Tables<"playlist_videos">;
export type WatchHistory = Tables<"watch_history">;

export type VideoWithArtist = Video & {
  artists: Pick<Artist, "id" | "name" | "slug" | "profile_image_url" | "verified"> | null;
};

export type PlaylistWithVideos = Playlist & {
  playlist_videos: Array<
    PlaylistVideo & {
      videos: Pick<Video, "id" | "title" | "thumbnail_url" | "duration"> | null;
    }
  >;
};

export type AdminUser = {
  id: string;
  username: string | null;
  displayName: string | null;
  joinedAt: string;
  roles: string[];
};

export type AdminArtist = Artist & {
  profile: Pick<Profile, "username" | "display_name"> | null;
};

const videoSelect = "*, artists(id, name, slug, profile_image_url, verified)";

function throwIfError<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function getPublicVideos(options: { genre?: string; limit?: number } = {}) {
  let query = supabase
    .from("videos")
    .select(videoSelect)
    .eq("is_public", true)
    .order("view_count", { ascending: false })
    .limit(options.limit ?? 20);
  if (options.genre) query = query.eq("genre", options.genre);
  return throwIfError(await query) as unknown as VideoWithArtist[];
}

export async function getNewReleases(options: { genre?: string; limit?: number } = {}) {
  let query = supabase
    .from("videos")
    .select(videoSelect)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 20);
  if (options.genre) query = query.eq("genre", options.genre);
  return throwIfError(await query) as unknown as VideoWithArtist[];
}

export async function getFeaturedArtists(limit = 12) {
  return throwIfError(
    await supabase
      .from("artists")
      .select(
        "id, name, slug, bio, profile_image_url, cover_image_url, verified, featured, created_at, updated_at, user_id",
      )
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit),
  ) as Artist[];
}

export async function getVideo(id: string) {
  return throwIfError(
    await supabase
      .from("videos")
      .select(videoSelect)
      .eq("id", id)
      .eq("is_public", true)
      .maybeSingle(),
  ) as unknown as VideoWithArtist | null;
}

export async function getRelatedVideos(video: VideoWithArtist, limit = 6) {
  let query = supabase
    .from("videos")
    .select(videoSelect)
    .eq("is_public", true)
    .neq("id", video.id)
    .order("view_count", { ascending: false })
    .limit(limit);
  if (video.genre) query = query.eq("genre", video.genre);
  return throwIfError(await query) as unknown as VideoWithArtist[];
}

export async function getArtist(slug: string) {
  return throwIfError(
    await supabase.from("artists").select("*").eq("slug", slug).maybeSingle(),
  ) as Artist | null;
}

export async function getArtistVideos(artistId: string) {
  return throwIfError(
    await supabase
      .from("videos")
      .select(videoSelect)
      .eq("artist_id", artistId)
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
  ) as unknown as VideoWithArtist[];
}

export async function getFollowerCount(artistId: string) {
  const result = await supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("artist_id", artistId);
  if (result.error) throw new Error(result.error.message);
  return result.count ?? 0;
}

export async function getFollowingCount(userId: string) {
  const result = await supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("follower_id", userId);
  if (result.error) throw new Error(result.error.message);
  return result.count ?? 0;
}

export async function getFollowState(userId: string | undefined, artistId: string) {
  if (!userId) return false;
  const result = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", userId)
    .eq("artist_id", artistId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return Boolean(result.data);
}

export async function setFollowState(userId: string, artistId: string, following: boolean) {
  if (following) {
    const insert: TablesInsert<"follows"> = { follower_id: userId, artist_id: artistId };
    throwIfError(
      await supabase
        .from("follows")
        .upsert(insert, { onConflict: "follower_id,artist_id", ignoreDuplicates: true }),
    );
  } else {
    throwIfError(
      await supabase.from("follows").delete().eq("follower_id", userId).eq("artist_id", artistId),
    );
  }
}

export async function getProfile(userId: string) {
  return throwIfError(
    await supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
  ) as Profile | null;
}

export async function updateProfile(userId: string, update: TablesUpdate<"profiles">) {
  return throwIfError(
    await supabase
      .from("profiles")
      .upsert({ id: userId, ...update }, { onConflict: "id" })
      .select("*")
      .single(),
  ) as Profile;
}

export async function getCurrentArtist(userId: string) {
  return throwIfError(
    await supabase.from("artists").select("*").eq("user_id", userId).maybeSingle(),
  ) as Artist | null;
}

export async function getUserPlaylists(userId: string) {
  return throwIfError(
    await supabase
      .from("playlists")
      .select("*, playlist_videos(*, videos(id, title, thumbnail_url, duration))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ) as unknown as PlaylistWithVideos[];
}

export async function createPlaylist(userId: string, name: string) {
  return throwIfError(
    await supabase
      .from("playlists")
      .insert({ user_id: userId, name: name.trim() })
      .select("*")
      .single(),
  ) as Playlist;
}

export async function deletePlaylist(userId: string, playlistId: string) {
  throwIfError(
    await supabase.from("playlists").delete().eq("id", playlistId).eq("user_id", userId),
  );
}

export async function addVideoToPlaylist(playlistId: string, videoId: string) {
  const result = await supabase
    .from("playlist_videos")
    .insert({ playlist_id: playlistId, video_id: videoId });
  if (result.error && result.error.code !== "23505") throw new Error(result.error.message);
}

export async function removeVideoFromPlaylist(playlistId: string, videoId: string) {
  throwIfError(
    await supabase
      .from("playlist_videos")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("video_id", videoId),
  );
}

export async function recordVideoView(videoId: string, viewerId?: string) {
  const insert: TablesInsert<"video_views"> = { video_id: videoId, viewer_id: viewerId ?? null };
  throwIfError(await supabase.from("video_views").insert(insert));
}

export async function getWatchHistory(userId: string, videoId: string) {
  return throwIfError(
    await supabase
      .from("watch_history")
      .select("*")
      .eq("user_id", userId)
      .eq("video_id", videoId)
      .maybeSingle(),
  ) as WatchHistory | null;
}

export async function saveWatchProgress(
  userId: string,
  videoId: string,
  progressSeconds: number,
  durationSeconds: number | null,
) {
  const completed =
    durationSeconds !== null && durationSeconds > 0 && progressSeconds >= durationSeconds * 0.95;
  const record: TablesInsert<"watch_history"> = {
    user_id: userId,
    video_id: videoId,
    progress_seconds: Math.max(0, Math.floor(progressSeconds)),
    duration_seconds: durationSeconds,
    completed,
    last_watched_at: new Date().toISOString(),
  };
  return throwIfError(
    await supabase
      .from("watch_history")
      .upsert(record, { onConflict: "user_id,video_id" })
      .select("*")
      .single(),
  ) as WatchHistory;
}

export async function getArtistDashboard(userId: string) {
  const artist = await getCurrentArtist(userId);
  if (!artist) return { artist: null, videos: [] as Video[], totalViews: 0, followerCount: 0 };
  const videos = throwIfError(
    await supabase
      .from("videos")
      .select("*")
      .eq("artist_id", artist.id)
      .order("created_at", { ascending: false }),
  ) as Video[];
  const followerCount = await getFollowerCount(artist.id);
  return {
    artist,
    videos,
    totalViews: videos.reduce((total, video) => total + video.view_count, 0),
    followerCount,
  };
}

export async function getAdminDashboard() {
  const [profilesResult, rolesResult, artistsResult, videosResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("artists").select("*").order("created_at", { ascending: false }),
    supabase.from("videos").select(videoSelect).order("created_at", { ascending: false }),
  ]);

  const profiles = throwIfError(profilesResult) ?? [];
  const roles = throwIfError(rolesResult) ?? [];
  const artists = (throwIfError(artistsResult) as unknown as Artist[]).map((artist) => ({
    ...artist,
    profile: profiles.find((profile) => profile.id === artist.user_id) ?? null,
  })) as AdminArtist[];
  const videos = throwIfError(videosResult) as unknown as VideoWithArtist[];
  const rolesByUser = new Map<string, string[]>();
  for (const role of roles) {
    const current = rolesByUser.get(role.user_id) ?? [];
    current.push(role.role);
    rolesByUser.set(role.user_id, current);
  }
  const users: AdminUser[] = profiles.map((profile) => ({
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    joinedAt: profile.created_at,
    roles: rolesByUser.get(profile.id) ?? [],
  }));

  return {
    users,
    artists,
    pendingArtists: artists.filter((artist) => !artist.verified),
    videos,
  };
}

export async function setArtistVerified(artistId: string, verified: boolean) {
  return throwIfError(
    await supabase.from("artists").update({ verified }).eq("id", artistId).select("*").single(),
  ) as Artist;
}

export async function removeVideoAsAdmin(videoId: string) {
  throwIfError(await supabase.from("videos").delete().eq("id", videoId));
}
