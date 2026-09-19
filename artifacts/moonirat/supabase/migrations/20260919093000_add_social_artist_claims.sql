BEGIN;

ALTER TABLE public.artists
    ALTER COLUMN user_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS x_url TEXT,
    ADD COLUMN IF NOT EXISTS facebook_url TEXT,
    ADD COLUMN IF NOT EXISTS instagram_url TEXT,
    ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

CREATE TABLE IF NOT EXISTS public.artist_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    claimant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    x_url TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    tiktok_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    review_note TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT artist_claim_has_social_link CHECK (
        x_url IS NOT NULL OR facebook_url IS NOT NULL OR instagram_url IS NOT NULL OR tiktok_url IS NOT NULL
    ),
    CONSTRAINT artist_claim_x_url CHECK (
        x_url IS NULL OR x_url ~* '^https://(www\.)?(x\.com|twitter\.com)/[A-Za-z0-9_]+/?$'
    ),
    CONSTRAINT artist_claim_facebook_url CHECK (
        facebook_url IS NULL OR facebook_url ~* '^https://(www\.)?facebook\.com/[A-Za-z0-9._-]+/?$'
    ),
    CONSTRAINT artist_claim_instagram_url CHECK (
        instagram_url IS NULL OR instagram_url ~* '^https://(www\.)?instagram\.com/[A-Za-z0-9._]+/?$'
    ),
    CONSTRAINT artist_claim_tiktok_url CHECK (
        tiktok_url IS NULL OR tiktok_url ~* '^https://(www\.)?tiktok\.com/@[A-Za-z0-9._]+/?$'
    )
);

CREATE INDEX IF NOT EXISTS artist_claims_artist_id_idx ON public.artist_claims(artist_id);
CREATE INDEX IF NOT EXISTS artist_claims_claimant_id_idx ON public.artist_claims(claimant_id);
CREATE UNIQUE INDEX IF NOT EXISTS artist_claims_one_pending_per_artist
    ON public.artist_claims(artist_id)
    WHERE status = 'pending';

ALTER TABLE public.artist_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit their own artist claims"
    ON public.artist_claims
    FOR INSERT
    TO authenticated
    WITH CHECK (
        claimant_id = (SELECT auth.uid())
        AND status = 'pending'
        AND reviewed_by IS NULL
        AND reviewed_at IS NULL
        AND EXISTS (
            SELECT 1 FROM public.artists
            WHERE artists.id = artist_claims.artist_id
              AND artists.user_id IS NULL
        )
        AND NOT EXISTS (
            SELECT 1 FROM public.artists
            WHERE artists.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Users can view their own artist claims"
    ON public.artist_claims
    FOR SELECT
    TO authenticated
    USING (
        claimant_id = (SELECT auth.uid())
        OR private.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    );

CREATE POLICY "Admins can review artist claims"
    ON public.artist_claims
    FOR UPDATE
    TO authenticated
    USING (private.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    WITH CHECK (private.has_role((SELECT auth.uid()), 'admin'::public.app_role));

GRANT SELECT, INSERT ON public.artist_claims TO authenticated;
GRANT ALL ON public.artist_claims TO service_role;

CREATE OR REPLACE FUNCTION public.review_artist_claim(
    claim_id UUID,
    decision TEXT,
    note TEXT DEFAULT NULL
)
RETURNS public.artist_claims
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    reviewed_claim public.artist_claims;
BEGIN
    IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;
    IF decision NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Decision must be approved or rejected';
    END IF;

    SELECT * INTO reviewed_claim
    FROM public.artist_claims
    WHERE id = claim_id AND status = 'pending'
    FOR UPDATE;
    IF reviewed_claim.id IS NULL THEN
        RAISE EXCEPTION 'Pending claim not found';
    END IF;

    IF decision = 'approved' THEN
        UPDATE public.artists
        SET user_id = reviewed_claim.claimant_id,
            verified = TRUE,
            x_url = reviewed_claim.x_url,
            facebook_url = reviewed_claim.facebook_url,
            instagram_url = reviewed_claim.instagram_url,
            tiktok_url = reviewed_claim.tiktok_url,
            updated_at = now()
        WHERE id = reviewed_claim.artist_id AND user_id IS NULL;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Artist page is already claimed';
        END IF;
    END IF;

    UPDATE public.artist_claims
    SET status = decision,
        review_note = NULLIF(BTRIM(note), ''),
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        updated_at = now()
    WHERE id = claim_id
    RETURNING * INTO reviewed_claim;

    RETURN reviewed_claim;
END;
$$;

REVOKE ALL ON FUNCTION public.review_artist_claim(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_artist_claim(UUID, TEXT, TEXT) TO authenticated;

COMMIT;