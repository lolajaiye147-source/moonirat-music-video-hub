-- V1 security hardening
-- SECURITY DEFINER helpers must not expose privileged behavior over RPC.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT _user_id = auth.uid()
       AND EXISTS (
           SELECT 1
           FROM public.user_roles
           WHERE user_id = _user_id
             AND role = _role
       )
$$;

REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Keep video ownership tied to the artist profile as well as the authenticated user.
DROP POLICY IF EXISTS "Users can manage their own videos" ON public.videos;
CREATE POLICY "Users can manage their own videos" ON public.videos
    FOR ALL TO authenticated
    USING (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.artists
            WHERE artists.id = videos.artist_id
              AND artists.user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.artists
            WHERE artists.id = videos.artist_id
              AND artists.user_id = auth.uid()
        )
    );

-- The previous FOR ALL policy had no INSERT WITH CHECK, which could allow
-- inserting a playlist item for another user's playlist.
DROP POLICY IF EXISTS "Users can manage videos in their own playlists" ON public.playlist_videos;
CREATE POLICY "Users can view videos in their own playlists" ON public.playlist_videos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE playlists.id = playlist_videos.playlist_id
              AND playlists.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can add videos to their own playlists" ON public.playlist_videos
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE playlists.id = playlist_videos.playlist_id
              AND playlists.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update videos in their own playlists" ON public.playlist_videos
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE playlists.id = playlist_videos.playlist_id
              AND playlists.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE playlists.id = playlist_videos.playlist_id
              AND playlists.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can remove videos from their own playlists" ON public.playlist_videos
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE playlists.id = playlist_videos.playlist_id
              AND playlists.user_id = auth.uid()
        )
    );

-- Users may read their own roles; only administrators/moderators may
-- enumerate roles for the moderation dashboard.
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'moderator')
    );

-- Anonymous views remain supported, but signed-in users cannot write watch
-- history on behalf of another account.
DROP POLICY IF EXISTS "Anyone can insert views" ON public.video_views;
CREATE POLICY "Anyone can insert views" ON public.video_views
    FOR INSERT
    WITH CHECK (
        viewer_id IS NULL
        OR viewer_id = auth.uid()
    );

-- Preserve sign-up metadata when email confirmation means there is no
-- authenticated client session yet for a follow-up profile update.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        NEW.id,
        NULLIF(NEW.raw_user_meta_data ->> 'username', ''),
        NULLIF(NEW.raw_user_meta_data ->> 'username', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_video_view() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;