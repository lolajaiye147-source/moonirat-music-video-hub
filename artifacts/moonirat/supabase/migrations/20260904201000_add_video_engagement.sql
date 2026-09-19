BEGIN;

CREATE TABLE IF NOT EXISTS public.video_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT video_likes_user_video_key UNIQUE (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS video_likes_video_created_idx
    ON public.video_likes (video_id, created_at DESC);

ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read likes on public videos" ON public.video_likes;
CREATE POLICY "Anyone can read likes on public videos"
    ON public.video_likes
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.videos
            WHERE videos.id = video_likes.video_id
              AND videos.is_public = true
        )
    );

DROP POLICY IF EXISTS "Users can like public videos" ON public.video_likes;
CREATE POLICY "Users can like public videos"
    ON public.video_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1
            FROM public.videos
            WHERE videos.id = video_likes.video_id
              AND videos.is_public = true
        )
    );

DROP POLICY IF EXISTS "Users can remove their likes" ON public.video_likes;
CREATE POLICY "Users can remove their likes"
    ON public.video_likes
    FOR DELETE
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

GRANT SELECT ON public.video_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.video_likes TO authenticated;
GRANT ALL ON public.video_likes TO service_role;

CREATE TABLE IF NOT EXISTS public.video_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 1000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_comments_video_created_idx
    ON public.video_comments (video_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS video_comments_user_id_idx
    ON public.video_comments (user_id);

ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comments on public videos" ON public.video_comments;
CREATE POLICY "Anyone can read comments on public videos"
    ON public.video_comments
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.videos
            WHERE videos.id = video_comments.video_id
              AND videos.is_public = true
        )
    );

DROP POLICY IF EXISTS "Users can comment on public videos" ON public.video_comments;
CREATE POLICY "Users can comment on public videos"
    ON public.video_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1
            FROM public.videos
            WHERE videos.id = video_comments.video_id
              AND videos.is_public = true
        )
    );

DROP POLICY IF EXISTS "Users can update their comments" ON public.video_comments;
CREATE POLICY "Users can update their comments"
    ON public.video_comments
    FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their comments" ON public.video_comments;
CREATE POLICY "Users can delete their comments"
    ON public.video_comments
    FOR DELETE
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

GRANT SELECT ON public.video_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.video_comments TO authenticated;
GRANT ALL ON public.video_comments TO service_role;

COMMIT;