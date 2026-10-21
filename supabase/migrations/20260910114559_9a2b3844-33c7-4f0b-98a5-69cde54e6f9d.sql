-- Helper functions in private schema
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
  ) OR EXISTS (
    SELECT 1 FROM public.organisations o
    WHERE o.id = _org_id AND o.owner_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION private.org_role(_user_id uuid, _org_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = _org_id AND o.owner_id = _user_id) THEN 'owner'
    ELSE (
      SELECT m.role FROM public.organisation_memberships m
      WHERE m.organisation_id = _org_id AND m.user_id = _user_id AND m.status = 'active'
      LIMIT 1
    )
  END
$$;

-- Fix organisations policies (previous subqueries compared membership.organisation_id to membership.id)
DROP POLICY IF EXISTS "Members can view their organisations" ON public.organisations;
CREATE POLICY "Members can view their organisations"
ON public.organisations FOR SELECT TO authenticated
USING (auth.uid() = owner_id OR private.is_org_member(auth.uid(), id));

DROP POLICY IF EXISTS "Owners and admins can update organisations" ON public.organisations;
CREATE POLICY "Owners and admins can update organisations"
ON public.organisations FOR UPDATE TO authenticated
USING (auth.uid() = owner_id OR private.org_role(auth.uid(), id) IN ('owner','admin') OR private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = owner_id OR private.org_role(auth.uid(), id) IN ('owner','admin') OR private.has_role(auth.uid(), 'admin'::app_role));

-- Members should be able to see co-members of their organisations
DROP POLICY IF EXISTS "Members can view co-members" ON public.organisation_memberships;
CREATE POLICY "Members can view co-members"
ON public.organisation_memberships FOR SELECT TO authenticated
USING (private.is_org_member(auth.uid(), organisation_id));

-- Invitations
CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX invitations_org_idx ON public.invitations (organisation_id);
CREATE INDEX invitations_email_idx ON public.invitations (lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view invitations"
ON public.invitations FOR SELECT TO authenticated
USING (private.org_role(auth.uid(), organisation_id) IN ('owner','admin'));

CREATE POLICY "Org admins can create invitations"
ON public.invitations FOR INSERT TO authenticated
WITH CHECK (private.org_role(auth.uid(), organisation_id) IN ('owner','admin') AND invited_by = auth.uid());

CREATE POLICY "Org admins can update invitations"
ON public.invitations FOR UPDATE TO authenticated
USING (private.org_role(auth.uid(), organisation_id) IN ('owner','admin'))
WITH CHECK (private.org_role(auth.uid(), organisation_id) IN ('owner','admin'));

CREATE TRIGGER update_invitations_updated_at
BEFORE UPDATE ON public.invitations
FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

-- Validation trigger for expiry/role/status instead of CHECK on now()
CREATE OR REPLACE FUNCTION private.validate_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role NOT IN ('admin','member') THEN
    RAISE EXCEPTION 'Invalid invitation role: %', NEW.role;
  END IF;
  IF NEW.status NOT IN ('pending','accepted','revoked') THEN
    RAISE EXCEPTION 'Invalid invitation status: %', NEW.status;
  END IF;
  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_invitation_before_write
BEFORE INSERT OR UPDATE ON public.invitations
FOR EACH ROW EXECUTE FUNCTION private.validate_invitation();

-- Accepting an invitation: security definer function callable by the invitee
CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.invitations;
  uid uuid := auth.uid();
  user_email text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO inv FROM public.invitations
  WHERE token = _token AND status = 'pending' AND expires_at > now();

  IF inv.id IS NULL THEN
    RAISE EXCEPTION 'Invitation is invalid or has expired';
  END IF;

  SELECT lower(email) INTO user_email FROM auth.users WHERE id = uid;
  IF user_email IS DISTINCT FROM lower(inv.email) THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  INSERT INTO public.organisation_memberships (organisation_id, user_id, role, status)
  VALUES (inv.organisation_id, uid, inv.role, 'active')
  ON CONFLICT (organisation_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = 'active';

  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = inv.id;

  RETURN inv.organisation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;