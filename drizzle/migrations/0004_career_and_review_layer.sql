-- Interview Lab
CREATE TABLE public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_target text NOT NULL,
  focus_capability_key text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  origin text NOT NULL CHECK (origin IN ('ai_draft','user_added')),
  capability_key text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.interview_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  self_rating integer CHECK (self_rating BETWEEN 1 AND 5),
  artefact_version_id uuid REFERENCES public.artefact_versions(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id)
);

-- Application tracking
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  role_title text NOT NULL,
  source text NOT NULL DEFAULT 'direct',
  stage text NOT NULL DEFAULT 'saved' CHECK (stage IN ('saved','applied','interviewing','offer','closed')),
  applied_at timestamptz,
  next_step text NOT NULL DEFAULT '',
  next_step_at timestamptz,
  notes text NOT NULL DEFAULT '',
  portfolio_share_id uuid REFERENCES public.portfolio_shares(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Performance review
CREATE TABLE public.performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_label text NOT NULL,
  self_summary text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','reviewed')),
  reviewer_id uuid REFERENCES auth.users(id),
  reviewer_summary text,
  reviewer_decision text CHECK (reviewer_decision IN ('confirmed','returned')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.interview_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.interview_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.interview_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.performance_reviews TO authenticated;
GRANT ALL ON public.interview_sessions TO service_role;
GRANT ALL ON public.interview_questions TO service_role;
GRANT ALL ON public.interview_answers TO service_role;
GRANT ALL ON public.job_applications TO service_role;
GRANT ALL ON public.performance_reviews TO service_role;

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own interview sessions" ON public.interview_sessions FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "create own interview sessions" ON public.interview_sessions FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "update own interview sessions" ON public.interview_sessions FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "own interview questions" ON public.interview_questions FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "create own interview questions" ON public.interview_questions FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "own interview answers" ON public.interview_answers FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "create own interview answers" ON public.interview_answers FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "update own interview answers" ON public.interview_answers FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "own applications" ON public.job_applications FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "create own applications" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "update own applications" ON public.job_applications FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "delete own applications" ON public.job_applications FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "own or coached performance reviews" ON public.performance_reviews FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR ((private.has_role(auth.uid(),'moderator') OR private.has_role(auth.uid(),'admin')) AND status <> 'draft'));
CREATE POLICY "create own performance reviews" ON public.performance_reviews FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND status = 'draft');
CREATE POLICY "update own draft performance reviews" ON public.performance_reviews FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND status = 'draft') WITH CHECK (owner_id = auth.uid() AND status IN ('draft','submitted'));

CREATE TRIGGER update_interview_sessions_updated_at BEFORE UPDATE ON public.interview_sessions FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();
CREATE TRIGGER update_interview_answers_updated_at BEFORE UPDATE ON public.interview_answers FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON public.performance_reviews FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

-- Coach decision on a submitted performance review. Never writes evidence and
-- never affects Verified state; it records a human reviewer's written outcome.
CREATE OR REPLACE FUNCTION public.review_performance_review(_review_id uuid, _decision text, _summary text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
DECLARE
  _coach uuid := auth.uid();
  _review public.performance_reviews%ROWTYPE;
BEGIN
  IF _coach IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  IF NOT (private.has_role(_coach,'moderator') OR private.has_role(_coach,'admin')) THEN RAISE EXCEPTION 'coach_role_required'; END IF;
  IF _decision NOT IN ('confirmed','returned') THEN RAISE EXCEPTION 'invalid_decision'; END IF;
  IF length(trim(coalesce(_summary,''))) < 10 THEN RAISE EXCEPTION 'reviewer_summary_required'; END IF;
  SELECT * INTO _review FROM public.performance_reviews WHERE id = _review_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'review_not_found'; END IF;
  IF _review.owner_id = _coach THEN RAISE EXCEPTION 'self_review_forbidden'; END IF;
  IF _review.status <> 'submitted' THEN RAISE EXCEPTION 'review_not_submitted'; END IF;
  UPDATE public.performance_reviews
  SET status = 'reviewed', reviewer_id = _coach, reviewer_decision = _decision,
      reviewer_summary = trim(_summary), reviewed_at = now()
  WHERE id = _review_id;
  RETURN _review_id;
END;
$$;