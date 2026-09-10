ALTER FUNCTION public.create_coaching_submission(uuid,text,text,public.coaching_intake_method,text,text,text,integer) SECURITY INVOKER;
ALTER FUNCTION public.review_coaching_submission(uuid,public.coach_review_decision,text) SECURITY INVOKER;

GRANT INSERT, UPDATE ON public.coaching_submissions TO authenticated;
CREATE POLICY "Candidates create own coaching submissions" ON public.coaching_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND state = 'pending'
    AND reviewed_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.coaching_exercises e
      JOIN public.coaching_programmes p ON p.id = e.programme_id
      JOIN public.artefact_versions v ON v.id = artefact_version_id
      WHERE e.id = exercise_id AND p.enabled AND v.owner_id = auth.uid()
    )
  );
CREATE POLICY "Candidates supersede rejected submissions" ON public.coaching_submissions
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND state = 'rejected')
  WITH CHECK (owner_id = auth.uid() AND state = 'superseded');
CREATE POLICY "Coaches transition pending submissions" ON public.coaching_submissions
  FOR UPDATE TO authenticated
  USING (
    state = 'pending'
    AND owner_id <> auth.uid()
    AND (private.has_role(auth.uid(), 'moderator') OR private.has_role(auth.uid(), 'admin'))
  )
  WITH CHECK (
    owner_id <> auth.uid()
    AND state IN ('confirmed','rejected')
    AND (private.has_role(auth.uid(), 'moderator') OR private.has_role(auth.uid(), 'admin'))
  );

GRANT INSERT ON public.coach_reviews TO authenticated;
CREATE POLICY "Coaches create immutable reviews" ON public.coach_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    coach_id = auth.uid()
    AND (private.has_role(auth.uid(), 'moderator') OR private.has_role(auth.uid(), 'admin'))
    AND EXISTS (
      SELECT 1 FROM public.coaching_submissions s
      WHERE s.id = submission_id AND s.state = 'pending' AND s.owner_id <> auth.uid()
    )
  );

CREATE POLICY "Coaches append confirmed coaching evidence" ON public.evidence_ledger
  FOR INSERT TO authenticated
  WITH CHECK (
    source = 'coaching_submission'
    AND strength = 'assessed'
    AND (private.has_role(auth.uid(), 'moderator') OR private.has_role(auth.uid(), 'admin'))
    AND EXISTS (
      SELECT 1
      FROM public.coaching_submissions s
      JOIN public.coach_reviews r ON r.submission_id = s.id
      JOIN public.coaching_exercises e ON e.id = s.exercise_id
      JOIN public.framework_capabilities fc ON fc.id = e.framework_capability_id
      WHERE s.owner_id = evidence_ledger.owner_id
        AND s.artefact_version_id = evidence_ledger.artefact_version_id
        AND s.state = 'confirmed'
        AND r.coach_id = auth.uid()
        AND r.decision = 'confirmed'
        AND fc.key = evidence_ledger.capability_key
        AND evidence_ledger.provenance->>'review_id' = r.id::text
        AND evidence_ledger.provenance->>'coach_id' = auth.uid()::text
        AND evidence_ledger.provenance->>'coach_confirmed' = 'true'
    )
  );