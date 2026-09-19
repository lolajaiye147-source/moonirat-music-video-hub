CREATE TABLE IF NOT EXISTS public.auth_email_rate_limits (
    bucket_hash TEXT PRIMARY KEY,
    window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    attempts INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS auth_email_rate_limits_window_started_idx
    ON public.auth_email_rate_limits (window_started_at);

ALTER TABLE public.auth_email_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.auth_email_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_auth_email_rate_limit(
    p_bucket_hash TEXT,
    p_limit INTEGER,
    p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_attempts INTEGER;
BEGIN
    DELETE FROM public.auth_email_rate_limits
    WHERE window_started_at < now() - interval '1 day';

    INSERT INTO public.auth_email_rate_limits (bucket_hash, window_started_at, attempts)
    VALUES (p_bucket_hash, now(), 1)
    ON CONFLICT (bucket_hash) DO UPDATE
    SET
        window_started_at = CASE
            WHEN public.auth_email_rate_limits.window_started_at
                <= now() - make_interval(secs => p_window_seconds)
            THEN now()
            ELSE public.auth_email_rate_limits.window_started_at
        END,
        attempts = CASE
            WHEN public.auth_email_rate_limits.window_started_at
                <= now() - make_interval(secs => p_window_seconds)
            THEN 1
            ELSE public.auth_email_rate_limits.attempts + 1
        END
    RETURNING attempts INTO current_attempts;

    RETURN current_attempts <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_auth_email_rate_limit(TEXT, INTEGER, INTEGER)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_auth_email_rate_limit(TEXT, INTEGER, INTEGER)
    TO service_role;