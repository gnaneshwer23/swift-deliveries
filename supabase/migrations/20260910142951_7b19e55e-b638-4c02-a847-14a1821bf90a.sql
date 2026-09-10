CREATE TABLE public.coaching_programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  framework_id uuid NOT NULL REFERENCES public.capability_frameworks(id) ON DELETE RESTRICT,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coaching_programmes TO authenticated;
GRANT ALL ON public.coaching_programmes TO service_role;
ALTER TABLE public.coaching_programmes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enabled programmes are visible to candidates" ON public.coaching_programmes
  FOR SELECT TO authenticated
  USING (enabled OR private.has_role(auth.uid(), 'moderator') OR private.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_coaching_programmes_updated_at
  BEFORE UPDATE ON public.coaching_programmes
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TABLE public.coaching_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid NOT NULL REFERENCES public.coaching_programmes(id) ON DELETE RESTRICT,
  framework_capability_id uuid NOT NULL REFERENCES public.framework_capabilities(id) ON DELETE RESTRICT,
  key text NOT NULL,
  title text NOT NULL,
  instructions text NOT NULL,
  artefact_type text NOT NULL CHECK (artefact_type IN ('prd','roadmap','stakeholder_map','sprint_plan','user_personas','okrs','gtm_strategy','business_case','custom')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (programme_id, key)
);
GRANT SELECT ON public.coaching_exercises TO authenticated;
GRANT ALL ON public.coaching_exercises TO service_role;
ALTER TABLE public.coaching_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Available exercises are visible to candidates" ON public.coaching_exercises
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coaching_programmes p
      WHERE p.id = programme_id
        AND (p.enabled OR private.has_role(auth.uid(), 'moderator') OR private.has_role(auth.uid(), 'admin'))
    )
  );

CREATE TYPE public.coaching_intake_method AS ENUM ('structured_response','file_upload','external_link');
CREATE TYPE public.coaching_submission_state AS ENUM ('pending','confirmed','rejected','superseded');
CREATE TYPE public.coach_review_decision AS ENUM ('confirmed','rejected');

CREATE TABLE public.coaching_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.coaching_exercises(id) ON DELETE RESTRICT,
  artefact_version_id uuid NOT NULL REFERENCES public.artefact_versions(id) ON DELETE RESTRICT,
  intake_method public.coaching_intake_method NOT NULL,
  external_url text,
  storage_path text,
  content_hash text NOT NULL,
  self_confidence integer CHECK (self_confidence BETWEEN 1 AND 5),
  state public.coaching_submission_state NOT NULL DEFAULT 'pending',
  attempt integer NOT NULL CHECK (attempt > 0),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE (owner_id, exercise_id, attempt),
  UNIQUE (artefact_version_id),
  CHECK (
    (intake_method = 'structured_response' AND external_url IS NULL AND storage_path IS NULL)
    OR (intake_method = 'file_upload' AND storage_path IS NOT NULL AND external_url IS NULL)
    OR (intake_method = 'external_link' AND external_url IS NOT NULL AND storage_path IS NULL)
  )
);
GRANT SELECT ON public.coaching_submissions TO authenticated;
GRANT ALL ON public.coaching_submissions TO service_role;
ALTER TABLE public.coaching_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidates read own coaching submissions" ON public.coaching_submissions
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Coaches read coaching review queue" ON public.coaching_submissions
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'moderator') OR private.has_role(auth.uid(), 'admin'));
CREATE INDEX coaching_submissions_owner_idx ON public.coaching_submissions (owner_id, submitted_at DESC);
CREATE INDEX coaching_submissions_queue_idx ON public.coaching_submissions (state, submitted_at ASC);

CREATE TABLE public.coach_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE REFERENCES public.coaching_submissions(id) ON DELETE RESTRICT,
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  decision public.coach_review_decision NOT NULL,
  coach_note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coach_reviews TO authenticated;
GRANT ALL ON public.coach_reviews TO service_role;
ALTER TABLE public.coach_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidates read reviews of own submissions" ON public.coach_reviews
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.coaching_submissions s
    WHERE s.id = submission_id AND s.owner_id = auth.uid()
  ));
CREATE POLICY "Coaches read coaching reviews" ON public.coach_reviews
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'moderator') OR private.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION private.guard_coaching_submission_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'immutable_record: coaching submissions cannot be deleted';
  END IF;
  IF OLD.owner_id <> NEW.owner_id
     OR OLD.exercise_id <> NEW.exercise_id
     OR OLD.artefact_version_id <> NEW.artefact_version_id
     OR OLD.intake_method <> NEW.intake_method
     OR OLD.external_url IS DISTINCT FROM NEW.external_url
     OR OLD.storage_path IS DISTINCT FROM NEW.storage_path
     OR OLD.content_hash <> NEW.content_hash
     OR OLD.self_confidence IS DISTINCT FROM NEW.self_confidence
     OR OLD.attempt <> NEW.attempt
     OR OLD.submitted_at <> NEW.submitted_at THEN
    RAISE EXCEPTION 'immutable_record: coaching submission content cannot change';
  END IF;
  IF NOT (
    (OLD.state = 'pending' AND NEW.state IN ('confirmed','rejected'))
    OR (OLD.state = 'rejected' AND NEW.state = 'superseded')
  ) THEN
    RAISE EXCEPTION 'invalid_submission_transition: % to %', OLD.state, NEW.state;
  END IF;
  IF NEW.state IN ('confirmed','rejected') AND NEW.reviewed_at IS NULL THEN
    RAISE EXCEPTION 'review_timestamp_required';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER coaching_submissions_guarded
  BEFORE UPDATE OR DELETE ON public.coaching_submissions
  FOR EACH ROW EXECUTE FUNCTION private.guard_coaching_submission_mutation();
CREATE TRIGGER coach_reviews_immutable
  BEFORE UPDATE OR DELETE ON public.coach_reviews
  FOR EACH ROW EXECUTE FUNCTION private.forbid_mutation();

DROP POLICY "Owners append own evidence" ON public.evidence_ledger;
CREATE POLICY "Owners append own non-coaching evidence" ON public.evidence_ledger
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND source <> 'coaching_submission');

CREATE OR REPLACE FUNCTION private.validate_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.source IN ('experience_sim','workspace_contribution','assessment','coaching_submission')
     AND NEW.artefact_version_id IS NULL THEN
    RAISE EXCEPTION 'evidence_requires_artefact_version: % evidence must cite an artefact version', NEW.source;
  END IF;
  IF NEW.source IN ('self_report','ai_draft') AND NEW.strength <> 'self_reported' THEN
    RAISE EXCEPTION 'evidence_strength_overstated: % evidence is always self_reported', NEW.source;
  END IF;
  IF NEW.source = 'coaching_submission' AND NEW.strength <> 'assessed' THEN
    RAISE EXCEPTION 'evidence_strength_invalid: coaching evidence must be assessed';
  END IF;
  IF NEW.strength = 'externally_verified' AND NEW.source <> 'external_verification' THEN
    RAISE EXCEPTION 'evidence_strength_overstated: externally_verified requires external_verification';
  END IF;
  IF NEW.source = 'external_verification' AND current_setting('role', true) <> 'service_role'
     AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'external_verification_reserved: only attestation confirmation can write this';
  END IF;
  IF NEW.artefact_version_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.artefact_versions v
    WHERE v.id = NEW.artefact_version_id AND v.owner_id = NEW.owner_id
  ) THEN
    RAISE EXCEPTION 'evidence_artefact_mismatch: artefact version does not belong to this person';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_coaching_submission(
  _exercise_id uuid,
  _title text,
  _body text,
  _intake_method public.coaching_intake_method,
  _external_url text DEFAULT NULL,
  _storage_path text DEFAULT NULL,
  _content_hash text DEFAULT NULL,
  _self_confidence integer DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  _owner uuid := auth.uid();
  _programme_enabled boolean;
  _artefact_id uuid;
  _version_id uuid;
  _submission_id uuid;
  _attempt integer;
  _artefact_type text;
BEGIN
  IF _owner IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  IF length(trim(_title)) < 3 OR length(trim(_body)) < 20 THEN RAISE EXCEPTION 'submission_content_required'; END IF;
  IF _content_hash IS NULL OR _content_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'valid_sha256_required'; END IF;
  IF _intake_method = 'external_link' AND (_external_url IS NULL OR _external_url !~ '^https://') THEN
    RAISE EXCEPTION 'secure_external_url_required';
  END IF;
  IF _intake_method = 'file_upload' AND (_storage_path IS NULL OR split_part(_storage_path, '/', 1) <> _owner::text) THEN
    RAISE EXCEPTION 'invalid_private_storage_path';
  END IF;

  SELECT p.enabled, e.artefact_type INTO _programme_enabled, _artefact_type
  FROM public.coaching_exercises e
  JOIN public.coaching_programmes p ON p.id = e.programme_id
  WHERE e.id = _exercise_id;
  IF NOT FOUND OR NOT _programme_enabled THEN RAISE EXCEPTION 'coaching_programme_not_enabled'; END IF;

  SELECT COALESCE(max(attempt), 0) + 1 INTO _attempt
  FROM public.coaching_submissions
  WHERE owner_id = _owner AND exercise_id = _exercise_id;

  UPDATE public.coaching_submissions
  SET state = 'superseded'
  WHERE owner_id = _owner AND exercise_id = _exercise_id AND state = 'rejected';

  INSERT INTO public.artefacts (owner_id, title, kind, description)
  VALUES (_owner, trim(_title), _artefact_type, 'Coaching exercise submission')
  RETURNING id INTO _artefact_id;

  INSERT INTO public.artefact_versions (artefact_id, owner_id, version, body, content)
  VALUES (_artefact_id, _owner, 1, _body, jsonb_strip_nulls(jsonb_build_object(
    'intake_method', _intake_method,
    'external_url', _external_url,
    'storage_path', _storage_path,
    'sha256', _content_hash
  ))) RETURNING id INTO _version_id;

  INSERT INTO public.coaching_submissions (
    owner_id, exercise_id, artefact_version_id, intake_method,
    external_url, storage_path, content_hash, self_confidence, attempt
  ) VALUES (
    _owner, _exercise_id, _version_id, _intake_method,
    _external_url, _storage_path, _content_hash, _self_confidence, _attempt
  ) RETURNING id INTO _submission_id;

  RETURN _submission_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_coaching_submission(uuid,text,text,public.coaching_intake_method,text,text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_coaching_submission(uuid,text,text,public.coaching_intake_method,text,text,text,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_coaching_submission(
  _submission_id uuid,
  _decision public.coach_review_decision,
  _coach_note text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  _coach uuid := auth.uid();
  _submission public.coaching_submissions%ROWTYPE;
  _review_id uuid;
  _capability_key text;
  _programme_id uuid;
  _programme_key text;
  _programme_name text;
  _framework_key text;
  _framework_version text;
  _exercise_key text;
  _exercise_title text;
BEGIN
  IF _coach IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  IF NOT (private.has_role(_coach, 'moderator') OR private.has_role(_coach, 'admin')) THEN
    RAISE EXCEPTION 'coach_role_required';
  END IF;
  IF length(trim(_coach_note)) < 3 THEN RAISE EXCEPTION 'coach_note_required'; END IF;

  SELECT * INTO _submission FROM public.coaching_submissions WHERE id = _submission_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'submission_not_found'; END IF;
  IF _submission.owner_id = _coach THEN RAISE EXCEPTION 'self_review_forbidden'; END IF;
  IF _submission.state <> 'pending' THEN RAISE EXCEPTION 'submission_already_reviewed'; END IF;

  SELECT fc.key, p.id, p.key, p.name, f.key, f.version, e.key, e.title
  INTO _capability_key, _programme_id, _programme_key, _programme_name,
       _framework_key, _framework_version, _exercise_key, _exercise_title
  FROM public.coaching_exercises e
  JOIN public.coaching_programmes p ON p.id = e.programme_id
  JOIN public.framework_capabilities fc ON fc.id = e.framework_capability_id
  JOIN public.capability_frameworks f ON f.id = fc.framework_id
  WHERE e.id = _submission.exercise_id;

  INSERT INTO public.coach_reviews (submission_id, coach_id, decision, coach_note)
  VALUES (_submission_id, _coach, _decision, trim(_coach_note))
  RETURNING id INTO _review_id;

  UPDATE public.coaching_submissions
  SET state = CASE WHEN _decision = 'confirmed' THEN 'confirmed'::public.coaching_submission_state ELSE 'rejected'::public.coaching_submission_state END,
      reviewed_at = now()
  WHERE id = _submission_id;

  IF _decision = 'confirmed' THEN
    INSERT INTO public.evidence_ledger (
      owner_id, artefact_version_id, source, strength, capability_key, summary, provenance, occurred_at
    ) VALUES (
      _submission.owner_id,
      _submission.artefact_version_id,
      'coaching_submission',
      'assessed',
      _capability_key,
      'Coach-confirmed coaching submission: ' || _exercise_title,
      jsonb_build_object(
        'review_id', _review_id,
        'coach_id', _coach,
        'coach_confirmed', true,
        'coach_confirmed_at', now(),
        'coach_note', trim(_coach_note),
        'coaching_programme_id', _programme_id,
        'programme_key', _programme_key,
        'programme_name', _programme_name,
        'exercise_id', _submission.exercise_id,
        'exercise_key', _exercise_key,
        'framework_key', _framework_key,
        'framework_version', _framework_version,
        'submission_attempt', _submission.attempt,
        'submission_date', _submission.submitted_at,
        'intake_method', _submission.intake_method,
        'content_hash', _submission.content_hash
      ),
      _submission.submitted_at
    );
  END IF;

  RETURN _review_id;
END;
$$;
REVOKE ALL ON FUNCTION public.review_coaching_submission(uuid,public.coach_review_decision,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_coaching_submission(uuid,public.coach_review_decision,text) TO authenticated;

CREATE POLICY "Candidates upload own coaching artefacts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'coaching-artefacts' AND split_part(name, '/', 1) = auth.uid()::text);
CREATE POLICY "Candidates read own coaching artefacts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'coaching-artefacts' AND split_part(name, '/', 1) = auth.uid()::text);
CREATE POLICY "Coaches read submitted coaching artefacts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'coaching-artefacts'
    AND (private.has_role(auth.uid(), 'moderator') OR private.has_role(auth.uid(), 'admin'))
    AND EXISTS (SELECT 1 FROM public.coaching_submissions s WHERE s.storage_path = name)
  );

INSERT INTO public.coaching_programmes (key, name, description, framework_id, enabled)
SELECT seed.key, seed.name, seed.description, f.id, false
FROM public.capability_frameworks f
CROSS JOIN (VALUES
  ('pm-foundations', 'PM Foundations', 'Structured product management foundations programme.'),
  ('pm-advanced', 'PM Advanced', 'Advanced product judgement and delivery programme.'),
  ('ba-essentials', 'BA Essentials', 'Structured business analysis foundations programme.'),
  ('project-delivery', 'Project Delivery', 'Structured project delivery foundations programme.')
) AS seed(key, name, description)
WHERE f.key = 'pm-core' AND f.version = '2026.1'
ON CONFLICT (key) DO NOTHING;