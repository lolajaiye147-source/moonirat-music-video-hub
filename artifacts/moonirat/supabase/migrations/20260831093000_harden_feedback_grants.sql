BEGIN;

REVOKE ALL ON public.feedback_submissions FROM anon, authenticated;
GRANT SELECT, INSERT ON public.feedback_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_submissions TO service_role;

COMMIT;