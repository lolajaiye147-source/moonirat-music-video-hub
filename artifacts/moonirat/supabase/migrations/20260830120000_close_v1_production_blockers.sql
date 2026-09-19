BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

ALTER TABLE public.videos
    ADD COLUMN IF NOT EXISTS upload_id UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS videos_upload_id_key
    ON public.videos (upload_id);

CREATE INDEX IF NOT EXISTS videos_public_views_page_idx
    ON public.videos (view_count DESC, created_at DESC, id)
    WHERE is_public = true;

CREATE INDEX IF NOT EXISTS videos_public_created_page_idx
    ON public.videos (created_at DESC, id)
    WHERE is_public = true;

CREATE INDEX IF NOT EXISTS videos_public_genre_views_page_idx
    ON public.videos (genre, view_count DESC, created_at DESC, id)
    WHERE is_public = true;

CREATE INDEX IF NOT EXISTS videos_title_trgm_idx
    ON public.videos
    USING gin (title extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS artists_name_trgm_idx
    ON public.artists
    USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS artists_slug_trgm_idx
    ON public.artists
    USING gin (slug extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS video_views_viewer_video_created_idx
    ON public.video_views (viewer_id, video_id, created_at DESC)
    WHERE viewer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS video_views_ip_video_created_idx
    ON public.video_views (ip_hash, video_id, created_at DESC)
    WHERE ip_hash IS NOT NULL;

DROP POLICY IF EXISTS "Anyone can insert views" ON public.video_views;
REVOKE INSERT ON public.video_views FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_qualified_video_view(
    p_video_id UUID,
    p_watched_seconds INTEGER,
    p_media_position INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_viewer_id UUID := auth.uid();
    v_ip_hash TEXT;
    v_headers JSONB := COALESCE(
        NULLIF(current_setting('request.headers', true), '')::jsonb,
        '{}'::jsonb
    );
    v_identity TEXT;
BEGIN
    IF p_watched_seconds < 3 OR p_media_position < 3 THEN
        RETURN false;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.videos
        WHERE id = p_video_id
          AND is_public = true
    ) THEN
        RETURN false;
    END IF;

    IF v_viewer_id IS NULL THEN
        v_ip_hash := encode(
            extensions.digest(
                COALESCE(
                    NULLIF(v_headers ->> 'cf-connecting-ip', ''),
                    NULLIF(split_part(COALESCE(v_headers ->> 'x-forwarded-for', ''), ',', 1), ''),
                    NULLIF(v_headers ->> 'x-real-ip', ''),
                    'unknown'
                ) || '|' || COALESCE(v_headers ->> 'user-agent', 'unknown') || '|moonirat-v1',
                'sha256'
            ),
            'hex'
        );
        v_identity := 'anon:' || v_ip_hash;
    ELSE
        v_identity := 'user:' || v_viewer_id::text;
    END IF;

    PERFORM pg_advisory_xact_lock(
        hashtextextended(p_video_id::text || ':' || v_identity, 0)
    );

    IF EXISTS (
        SELECT 1
        FROM public.video_views
        WHERE video_id = p_video_id
          AND created_at >= now() - interval '24 hours'
          AND (
              (v_viewer_id IS NOT NULL AND viewer_id = v_viewer_id)
              OR
              (v_viewer_id IS NULL AND viewer_id IS NULL AND ip_hash = v_ip_hash)
          )
    ) THEN
        RETURN false;
    END IF;

    INSERT INTO public.video_views (video_id, viewer_id, ip_hash)
    VALUES (p_video_id, v_viewer_id, v_ip_hash);

    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_qualified_video_view(UUID, INTEGER, INTEGER)
    FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_qualified_video_view(UUID, INTEGER, INTEGER)
    TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('remove_video')),
    status TEXT NOT NULL CHECK (status IN ('started', 'failed', 'completed')),
    video_storage_path TEXT,
    thumbnail_storage_path TEXT,
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS moderation_actions_video_created_idx
    ON public.moderation_actions (video_id, created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_actions_actor_id_idx
    ON public.moderation_actions (actor_id)
    WHERE actor_id IS NOT NULL;

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view moderation actions" ON public.moderation_actions;
CREATE POLICY "Admins can view moderation actions"
    ON public.moderation_actions
    FOR SELECT
    TO authenticated
    USING (private.has_role((SELECT auth.uid()), 'admin'::public.app_role));

GRANT SELECT ON public.moderation_actions TO authenticated;
GRANT ALL ON public.moderation_actions TO service_role;

COMMIT;