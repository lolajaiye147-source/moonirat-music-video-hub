BEGIN;

CREATE POLICY "Admins can update artists"
    ON public.artists
    FOR UPDATE
    TO authenticated
    USING (private.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    WITH CHECK (private.has_role((SELECT auth.uid()), 'admin'::public.app_role));

CREATE POLICY "Admins can remove videos"
    ON public.videos
    FOR DELETE
    TO authenticated
    USING (private.has_role((SELECT auth.uid()), 'admin'::public.app_role));

COMMIT;