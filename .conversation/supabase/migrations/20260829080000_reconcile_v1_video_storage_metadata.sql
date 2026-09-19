ALTER TABLE public.videos
    ADD COLUMN IF NOT EXISTS storage_path TEXT,
    ADD COLUMN IF NOT EXISTS master_playlist_url TEXT;