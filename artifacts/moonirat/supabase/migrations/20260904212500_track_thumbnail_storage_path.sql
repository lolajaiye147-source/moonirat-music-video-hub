BEGIN;

ALTER TABLE public.videos
    ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT;

COMMIT;