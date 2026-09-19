BEGIN;

CREATE TABLE IF NOT EXISTS public.feedback_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    submission_key UUID NOT NULL DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN (
        'bug',
        'feature',
        'upload_issue',
        'playback_issue',
        'verification',
        'search_discovery',
        'general'
    )),
    subject TEXT NOT NULL CHECK (char_length(btrim(subject)) BETWEEN 1 AND 160),
    message TEXT NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 4000),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'planned', 'resolved', 'closed')),
    admin_response TEXT CHECK (admin_response IS NULL OR char_length(admin_response) <= 4000),
    admin_notes TEXT CHECK (admin_notes IS NULL OR char_length(admin_notes) <= 4000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT feedback_submissions_submission_key_key UNIQUE (submission_key)
);

CREATE INDEX IF NOT EXISTS feedback_submissions_user_created_idx
    ON public.feedback_submissions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_submissions_status_created_idx
    ON public.feedback_submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_submissions_type_created_idx
    ON public.feedback_submissions (type, created_at DESC);

GRANT SELECT, INSERT ON public.feedback_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_submissions TO service_role;

ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own feedback" ON public.feedback_submissions;
CREATE POLICY "Users can create their own feedback"
    ON public.feedback_submissions
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback_submissions;
CREATE POLICY "Users can view their own feedback"
    ON public.feedback_submissions
    FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = user_id
        OR private.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    );

DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback_submissions;
CREATE POLICY "Admins can update feedback"
    ON public.feedback_submissions
    FOR UPDATE
    TO authenticated
    USING (private.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    WITH CHECK (private.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS update_feedback_submissions_updated_at ON public.feedback_submissions;
CREATE TRIGGER update_feedback_submissions_updated_at
    BEFORE UPDATE ON public.feedback_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;