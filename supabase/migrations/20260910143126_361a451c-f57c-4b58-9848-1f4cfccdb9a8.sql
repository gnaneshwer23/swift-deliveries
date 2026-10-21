CREATE POLICY "Coaches read submitted artefact versions" ON public.artefact_versions
  FOR SELECT TO authenticated
  USING (
    (private.has_role(auth.uid(), 'moderator') OR private.has_role(auth.uid(), 'admin'))
    AND EXISTS (
      SELECT 1 FROM public.coaching_submissions s
      WHERE s.artefact_version_id = artefact_versions.id
    )
  );
CREATE POLICY "Coaches read coaching candidate profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (private.has_role(auth.uid(), 'moderator') OR private.has_role(auth.uid(), 'admin'))
    AND EXISTS (
      SELECT 1 FROM public.coaching_submissions s
      WHERE s.owner_id = profiles.id
    )
  );