-- See live migration deliverx_fix_org_rls_recursion
CREATE OR REPLACE FUNCTION private.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organisations o
    WHERE o.id = _org_id AND o.owner_id = _user_id
  );
$$;

GRANT EXECUTE ON FUNCTION private.is_org_owner(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organisation_memberships m
    WHERE m.organisation_id = _org_id
      AND m.user_id = _user_id
      AND m.status = 'active'
  ) OR private.is_org_owner(_user_id, _org_id);
$$;

DROP POLICY IF EXISTS "dx_members_view_organisations" ON public.organisations;
CREATE POLICY "dx_members_view_organisations"
  ON public.organisations FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR private.is_org_member(auth.uid(), id)
  );

DROP POLICY IF EXISTS "dx_owners_update_organisations" ON public.organisations;
CREATE POLICY "dx_owners_update_organisations"
  ON public.organisations FOR UPDATE TO authenticated
  USING (
    auth.uid() = owner_id
    OR private.has_role(auth.uid(), 'admin')
    OR private.org_role(auth.uid(), id) IN ('admin', 'owner')
  )
  WITH CHECK (
    auth.uid() = owner_id
    OR private.has_role(auth.uid(), 'admin')
    OR private.org_role(auth.uid(), id) IN ('admin', 'owner')
  );

DROP POLICY IF EXISTS "dx_owners_manage_memberships" ON public.organisation_memberships;
CREATE POLICY "dx_owners_manage_memberships"
  ON public.organisation_memberships FOR ALL TO authenticated
  USING (
    private.is_org_owner(auth.uid(), organisation_id)
    OR private.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    private.is_org_owner(auth.uid(), organisation_id)
    OR private.has_role(auth.uid(), 'admin')
    OR (auth.uid() = user_id AND role = 'owner' AND status = 'active')
  );

DROP POLICY IF EXISTS "dx_users_insert_own_owner_membership" ON public.organisation_memberships;
CREATE POLICY "dx_users_insert_own_owner_membership"
  ON public.organisation_memberships FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      role = 'owner'
      OR private.is_org_owner(auth.uid(), organisation_id)
    )
  );
