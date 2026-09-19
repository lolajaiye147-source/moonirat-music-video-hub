BEGIN;

DROP POLICY IF EXISTS "Users can manage their own artist profile" ON public.artists;

CREATE POLICY "Artists can update their claimed profile"
    ON public.artists
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

COMMIT;