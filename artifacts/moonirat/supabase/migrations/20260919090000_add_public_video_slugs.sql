BEGIN;

ALTER TABLE public.videos
    ADD COLUMN IF NOT EXISTS public_slug TEXT;

CREATE OR REPLACE FUNCTION public.make_video_public_slug(video_title TEXT, video_id UUID)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = ''
AS $$
    SELECT
        COALESCE(
            NULLIF(
                LEFT(
                    TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(COALESCE(video_title, '')), '[^a-z0-9]+', '-', 'g')),
                    36
                ),
                ''
            ),
            'video'
        )
        || '-' ||
        LEFT(REPLACE(video_id::TEXT, '-', ''), 12);
$$;

UPDATE public.videos
SET public_slug = public.make_video_public_slug(title, id)
WHERE public_slug IS NULL OR BTRIM(public_slug) = '';

ALTER TABLE public.videos
    ALTER COLUMN public_slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS videos_public_slug_key
    ON public.videos (public_slug);

CREATE OR REPLACE FUNCTION public.assign_video_public_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.public_slug IS NULL OR BTRIM(NEW.public_slug) = '' THEN
        NEW.public_slug := public.make_video_public_slug(NEW.title, NEW.id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_video_public_slug ON public.videos;
CREATE TRIGGER assign_video_public_slug
    BEFORE INSERT ON public.videos
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_video_public_slug();

COMMIT;