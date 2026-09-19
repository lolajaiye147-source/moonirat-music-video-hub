import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Artist = Tables<"artists">;
export type ArtistClaim = Tables<"artist_claims">;
export type Video = Tables<"videos">;
export type Profile = Tables<"profiles">;
export type Playlist = Tables<"playlists">;
export type PlaylistVideo = Tables<"playlist_videos">;
export type WatchHistory = Tables<"watch_history">;
export type FeedbackSubmission = Tables<"feedback_submissions">;
export type FeedbackType = FeedbackSubmission["type"];
export type FeedbackStatus = FeedbackSubmission["status"];
export type FeedbackPriority = FeedbackSubmission["priority"];
export type VideoComment = Tables<"video_comments">;

export type VideoCommentWithProfile = VideoComment & {
  profile: Pick<Profile, "display_name" | "username" | "avatar_url"> | null;
};

export type VideoWithArtist = Video & {
  artists: Pick<Artist, "id" | "name" | "slug" | "profile_image_url" | "verified"> | null;
};

export type PlaylistWithVideos = Playlist & {
  playlist_videos: Array<
    PlaylistVideo & {
      videos: Pick<Video, "id" | "public_slug" | "title" | "thumbnail_url" | "duration"> | null;
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

export type AdminArtistClaim = ArtistClaim & {
  artist: Pick<Artist, "id" | "name" | "slug"> | null;
  claimant: Pick<Profile, "display_name" | "username"> | null;
};

export const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature request" },
  { value: "upload_issue", label: "Upload issue" },
  { value: "playback_issue", label: "Playback issue" },
  { value: "verification", label: "Verification" },
  { value: "search_discovery", label: "Search / discovery" },
  { value: "general", label: "General" },
] as const;

export const FEEDBACK_STATUSES = [
  { value: "open", label: "Open" },
  { value: "reviewing", label: "Reviewing" },
  { value: "planned", label: "Planned" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

export const FEEDBACK_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

const videoSelect = "*, artists(id, name, slug, profile_image_url, verified)";

function throwIfError<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function getPublicVideos(
  options: { genre?: string; limit?: number; offset?: number } = {},
) {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  let query = supabase
    .from("videos")
    .select(videoSelect)
    .eq("is_public", true)
    .order("view_count", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);
  if (options.genre) query = query.eq("genre", options.genre);
  return throwIfError(await query) as unknown as VideoWithArtist[];
}

export async function getNewReleases(
  options: { genre?: string; limit?: number; offset?: number } = {},
) {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  let query = supabase
    .from("videos")
    .select(videoSelect)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);
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

export async function getVideoByPublicSlug(publicSlug: string) {
  return throwIfError(
    await supabase
      .from("videos")
      .select(videoSelect)
      .eq("public_slug", publicSlug)
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
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
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

export async function getMyFeedback(userId: string) {
  return throwIfError(
    await supabase
      .from("feedback_submissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ) as FeedbackSubmission[];
}

export async function createFeedback(
  userId: string,
  input: {
    submission_key: string;
    type: FeedbackType;
    subject: string;
    message: string;
  },
) {
  const subject = input.subject.trim();
  const message = input.message.trim();
  if (!subject || subject.length > 160) throw new Error("Subject must be between 1 and 160 characters.");
  if (!message || message.length > 4000) throw new Error("Message must be between 1 and 4000 characters.");

  return throwIfError(
    await supabase
      .from("feedback_submissions")
      .upsert(
        {
          user_id: userId,
          submission_key: input.submission_key,
          type: input.type,
          subject,
          message,
        },
        { onConflict: "submission_key" },
      )
      .select("*")
      .single(),
  ) as FeedbackSubmission;
}

export async function getCurrentArtist(userId: string) {
  return throwIfError(
    await supabase.from("artists").select("*").eq("user_id", userId).maybeSingle(),
  ) as Artist | null;
}

export async function createArtist(
  userId: string,
  name: string,
  slug: string,
  bio: string | null,
) {
  return throwIfError(
    await supabase
      .from("artists")
      .insert({
        user_id: userId,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        bio: bio?.trim() || null,
      })
      .select("*")
      .single(),
  ) as Artist;
}

export async function getMyArtistClaim(userId: string, artistId: string) {
  return throwIfError(
    await supabase
      .from("artist_claims")
      .select("*")
      .eq("claimant_id", userId)
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ) as ArtistClaim | null;
}

export async function submitArtistClaim(
  userId: string,
  artistId: string,
  links: Pick<ArtistClaim, "x_url" | "facebook_url" | "instagram_url" | "tiktok_url">,
) {
  return throwIfError(
    await supabase
      .from("artist_claims")
      .insert({ claimant_id: userId, artist_id: artistId, ...links })
      .select("*")
      .single(),
  ) as ArtistClaim;
}

export async function getUserPlaylists(userId: string) {
  return throwIfError(
    await supabase
      .from("playlists")
      .select("*, playlist_videos(*, videos(id, public_slug, title, thumbnail_url, duration))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ) as unknown as PlaylistWithVideos[];
}

export async function getLikedVideos(userId: string) {
  const likes = throwIfError(
    await supabase
      .from("video_likes")
      .select("video_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ) as Array<{ video_id: string; created_at: string }>;
  if (!likes.length) return [] as VideoWithArtist[];
  const videos = throwIfError(
    await supabase
      .from("videos")
      .select(videoSelect)
      .in(
        "id",
        likes.map((like) => like.video_id),
      )
      .eq("is_public", true),
  ) as unknown as VideoWithArtist[];
  const position = new Map(likes.map((like, index) => [like.video_id, index]));
  return videos.sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0));
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

export async function getVideoEngagement(videoId: string, userId?: string) {
  const [likesResult, userLikeResult, commentsResult] = await Promise.all([
    supabase.from("video_likes").select("id", { count: "exact", head: true }).eq("video_id", videoId),
    userId
      ? supabase
          .from("video_likes")
          .select("id")
          .eq("video_id", videoId)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("video_comments")
      .select("*")
      .eq("video_id", videoId)
      .order("created_at", { ascending: false }),
  ]);
  if (likesResult.error) throw new Error(likesResult.error.message);
  if (userLikeResult.error) throw new Error(userLikeResult.error.message);
  const comments = throwIfError(commentsResult) as VideoComment[];
  const userIds = [...new Set(comments.map((comment) => comment.user_id))];
  const profiles = userIds.length
    ? (throwIfError(
        await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .in("id", userIds),
      ) as Array<Pick<Profile, "id" | "display_name" | "username" | "avatar_url">>)
    : [];
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  return {
    likeCount: likesResult.count ?? 0,
    likedByUser: Boolean(userLikeResult.data),
    comments: comments.map((comment) => ({
      ...comment,
      profile: profilesById.get(comment.user_id) ?? null,
    })) as VideoCommentWithProfile[],
  };
}

export async function setVideoLike(userId: string, videoId: string, liked: boolean) {
  if (liked) {
    const result = await supabase
      .from("video_likes")
      .upsert({ user_id: userId, video_id: videoId }, { onConflict: "user_id,video_id" });
    if (result.error) throw new Error(result.error.message);
    return;
  }
  throwIfError(
    await supabase
      .from("video_likes")
      .delete()
      .eq("user_id", userId)
      .eq("video_id", videoId),
  );
}

export async function createVideoComment(userId: string, videoId: string, body: string) {
  const normalizedBody = body.trim();
  if (!normalizedBody || normalizedBody.length > 1000) {
    throw new Error("Comments must be between 1 and 1,000 characters.");
  }
  return throwIfError(
    await supabase
      .from("video_comments")
      .insert({ user_id: userId, video_id: videoId, body: normalizedBody })
      .select("*")
      .single(),
  ) as VideoComment;
}

export async function deleteVideoComment(userId: string, commentId: string) {
  throwIfError(
    await supabase
      .from("video_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId),
  );
}

export async function recordVideoView(
  videoId: string,
  watchedSeconds: number,
  mediaPosition: number,
) {
  return throwIfError(
    await supabase.rpc("record_qualified_video_view", {
      p_video_id: videoId,
      p_watched_seconds: Math.floor(watchedSeconds),
      p_media_position: Math.floor(mediaPosition),
    }),
  );
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
    duration_seconds:
      durationSeconds !== null && Number.isFinite(durationSeconds)
        ? Math.max(0, Math.round(durationSeconds))
        : null,
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
  const [profilesResult, rolesResult, artistsResult, videosResult, claimsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("artists").select("*").order("created_at", { ascending: false }),
    supabase.from("videos").select(videoSelect).order("created_at", { ascending: false }),
    supabase.from("artist_claims").select("*").order("created_at", { ascending: false }),
  ]);

  const profiles = throwIfError(profilesResult) ?? [];
  const roles = throwIfError(rolesResult) ?? [];
  const artists = (throwIfError(artistsResult) as unknown as Artist[]).map((artist) => ({
    ...artist,
    profile: profiles.find((profile) => profile.id === artist.user_id) ?? null,
  })) as AdminArtist[];
  const videos = throwIfError(videosResult) as unknown as VideoWithArtist[];
  const claims = (throwIfError(claimsResult) as ArtistClaim[]).map((claim) => ({
    ...claim,
    artist: artists.find((artist) => artist.id === claim.artist_id) ?? null,
    claimant: profiles.find((profile) => profile.id === claim.claimant_id) ?? null,
  })) as AdminArtistClaim[];
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
    pendingClaims: claims.filter((claim) => claim.status === "pending"),
    videos,
  };
}

export async function reviewArtistClaim(claimId: string, decision: "approved" | "rejected") {
  return throwIfError(
    await supabase.rpc("review_artist_claim", {
      claim_id: claimId,
      decision,
      note: null,
    }),
  ) as ArtistClaim;
}

export async function setArtistVerified(artistId: string, verified: boolean) {
  return throwIfError(
    await supabase.from("artists").update({ verified }).eq("id", artistId).select("*").single(),
  ) as Artist;
}
