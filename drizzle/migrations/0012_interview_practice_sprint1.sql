-- Typed questions linked to record entries, with follow-up threading
ALTER TABLE public.interview_questions
  ADD COLUMN source_evidence_id uuid REFERENCES public.evidence_ledger(id),
  ADD COLUMN question_type text NOT NULL DEFAULT 'defend' CHECK (question_type IN ('defend','trade-off','stakeholder','metric')),
  ADD COLUMN parent_question_id uuid REFERENCES public.interview_questions(id),
  ADD COLUMN depth integer NOT NULL DEFAULT 0;

-- Answers freeze at submit with a checksum
ALTER TABLE public.interview_answers
  ADD COLUMN checksum text;

-- Practice signal marker on every interview table (trust rail: never feeds Verified)
ALTER TABLE public.interview_sessions ADD COLUMN signal_level text NOT NULL DEFAULT 'practice' CHECK (signal_level = 'practice');
ALTER TABLE public.interview_questions ADD COLUMN signal_level text NOT NULL DEFAULT 'practice' CHECK (signal_level = 'practice');
ALTER TABLE public.interview_answers ADD COLUMN signal_level text NOT NULL DEFAULT 'practice' CHECK (signal_level = 'practice');

-- Record check output: claims extracted from answers
CREATE TABLE public.answer_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id uuid NOT NULL REFERENCES public.interview_answers(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  claim_text text NOT NULL,
  claim_type text NOT NULL CHECK (claim_type IN ('metric','action','outcome','role')),
  matched_evidence_id uuid REFERENCES public.evidence_ledger(id),
  support_status text NOT NULL CHECK (support_status IN ('supported','partial','not_in_record','contradicted')),
  record_excerpt text,
  signal_level text NOT NULL DEFAULT 'practice' CHECK (signal_level = 'practice'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.answer_claims TO authenticated;
GRANT ALL ON public.answer_claims TO service_role;
ALTER TABLE public.answer_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own claims" ON public.answer_claims FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Users insert own claims" ON public.answer_claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

-- Framework-scored feedback per session
CREATE TABLE public.interview_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  rubric_dimension text NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 1 AND 5),
  rationale text NOT NULL,
  source text NOT NULL DEFAULT 'ai' CHECK (source IN ('ai','peer','coach')),
  reviewer_id uuid,
  signal_level text NOT NULL DEFAULT 'practice' CHECK (signal_level = 'practice'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.interview_feedback TO authenticated;
GRANT ALL ON public.interview_feedback TO service_role;
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own feedback" ON public.interview_feedback FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Users insert own feedback" ON public.interview_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);