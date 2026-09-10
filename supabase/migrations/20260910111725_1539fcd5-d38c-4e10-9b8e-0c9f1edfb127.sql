DROP POLICY IF EXISTS "Owners and admins can update organisations" ON public.organisations;
DROP POLICY IF EXISTS "Organisation owners can manage memberships" ON public.organisation_memberships;

DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(UUID, public.app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION private.has_role(UUID, public.app_role) FROM anon;

CREATE OR REPLACE FUNCTION private.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = private, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_organisations_updated_at ON public.organisations;
DROP TRIGGER IF EXISTS update_organisation_memberships_updated_at ON public.organisation_memberships;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TRIGGER update_organisations_updated_at
  BEFORE UPDATE ON public.organisations
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TRIGGER update_organisation_memberships_updated_at
  BEFORE UPDATE ON public.organisation_memberships
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

CREATE POLICY "Owners and admins can update organisations"
  ON public.organisations FOR UPDATE TO authenticated
  USING (
    auth.uid() = owner_id
    OR private.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.organisation_memberships
      WHERE organisation_id = id AND user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    auth.uid() = owner_id
    OR private.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.organisation_memberships
      WHERE organisation_id = id AND user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Organisation owners can manage memberships"
  ON public.organisation_memberships FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organisations o
      WHERE o.id = organisation_id AND o.owner_id = auth.uid()
    )
    OR private.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organisations o
      WHERE o.id = organisation_id AND o.owner_id = auth.uid()
    )
    OR private.has_role(auth.uid(), 'admin')
  );