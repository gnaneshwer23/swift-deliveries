CREATE POLICY "Members read profiles of same organisation"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organisation_memberships mine
    JOIN public.organisation_memberships theirs
      ON theirs.organisation_id = mine.organisation_id
    WHERE mine.user_id = auth.uid()
      AND mine.status = 'active'
      AND theirs.status = 'active'
      AND theirs.user_id = profiles.id
  )
);