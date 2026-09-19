BEGIN;

-- Cover foreign keys used by ownership checks, joins, and cascade operations.
CREATE INDEX IF NOT EXISTS artists_user_id_idx
    ON public.artists (user_id);
CREATE INDEX IF NOT EXISTS follows_artist_id_idx
    ON public.follows (artist_id);
CREATE INDEX IF NOT EXISTS playlist_videos_video_id_idx
    ON public.playlist_videos (video_id);
CREATE INDEX IF NOT EXISTS playlists_user_id_idx
    ON public.playlists (user_id);
CREATE INDEX IF NOT EXISTS video_views_video_id_idx
    ON public.video_views (video_id);
CREATE INDEX IF NOT EXISTS video_views_viewer_id_idx
    ON public.video_views (viewer_id);
CREATE INDEX IF NOT EXISTS videos_artist_id_idx
    ON public.videos (artist_id);
CREATE INDEX IF NOT EXISTS videos_user_id_idx
    ON public.videos (user_id);

-- Evaluate auth.uid() once per statement instead of once per candidate row.
ALTER POLICY "Users can manage their own artist profile"
    ON public.artists
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can manage their own follows"
    ON public.follows
    USING ((SELECT auth.uid()) = follower_id)
    WITH CHECK ((SELECT auth.uid()) = follower_id);

ALTER POLICY "Users can add videos to their own playlists"
    ON public.playlist_videos
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.playlists
            WHERE playlists.id = playlist_videos.playlist_id
              AND playlists.user_id = (SELECT auth.uid())
        )
    );

ALTER POLICY "Users can remove videos from their own playlists"
    ON public.playlist_videos
    USING (
        EXISTS (
            SELECT 1
            FROM public.playlists
            WHERE playlists.id = playlist_videos.playlist_id
              AND playlists.user_id = (SELECT auth.uid())
        )
    );

ALTER POLICY "Users can update videos in their own playlists"
    ON public.playlist_videos
    USING (
        EXISTS (
            SELECT 1
            FROM public.playlists
            WHERE playlists.id = playlist_videos.playlist_id
              AND playlists.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.playlists
            WHERE playlists.id = playlist_videos.playlist_id
              AND playlists.user_id = (SELECT auth.uid())
        )
    );

ALTER POLICY "Users can view videos in their own playlists"
    ON public.playlist_videos
    USING (
        EXISTS (
            SELECT 1
            FROM public.playlists
            WHERE playlists.id = playlist_videos.playlist_id
              AND playlists.user_id = (SELECT auth.uid())
        )
    );

ALTER POLICY "Users can manage their own playlists"
    ON public.playlists
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can manage their own profile"
    ON public.profiles
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

ALTER POLICY "Users can view their own roles"
    ON public.user_roles
    USING (
        (SELECT auth.uid()) = user_id
        OR private.has_role((SELECT auth.uid()), 'admin'::public.app_role)
        OR private.has_role((SELECT auth.uid()), 'moderator'::public.app_role)
    );

ALTER POLICY "Anyone can insert views"
    ON public.video_views
    WITH CHECK (
        viewer_id IS NULL
        OR viewer_id = (SELECT auth.uid())
    );

ALTER POLICY "Users can manage their own videos"
    ON public.videos
    USING (
        (SELECT auth.uid()) = user_id
        AND EXISTS (
            SELECT 1
            FROM public.artists
            WHERE artists.id = videos.artist_id
              AND artists.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = user_id
        AND EXISTS (
            SELECT 1
            FROM public.artists
            WHERE artists.id = videos.artist_id
              AND artists.user_id = (SELECT auth.uid())
        )
    );

COMMIT;