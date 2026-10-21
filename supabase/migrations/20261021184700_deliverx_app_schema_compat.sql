-- DeliverX app schema compatibility for project jibmyxaldetyycmtlxet.
-- Additive only: does not drop legacy tables or destroy rows.
-- The live DB predates the DeliverX candidate schema; this bridges the gap
-- for auth, profiles, organisations, onboarding, and capability frameworks.

CREATE SCHEMA IF NOT EXISTS private;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Profiles (DeliverX person record; separate from legacy public.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  headline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(UUID, public.app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION private.has_role(UUID, public.app_role) FROM anon;

CREATE OR REPLACE FUNCTION private.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Backfill profiles for existing auth users
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email),
  u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- Extend legacy organisations with DeliverX columns (keep existing rows)
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.organisations
SET slug = COALESCE(
  NULLIF(slug, ''),
  lower(regexp_replace(regexp_replace(coalesce(name, 'org'), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
  || '-' || substr(replace(id::text, '-', ''), 1, 8)
)
WHERE slug IS NULL OR slug = '';

DO $$ BEGIN
  ALTER TABLE public.organisations ALTER COLUMN slug SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS organisations_slug_key ON public.organisations (slug);

GRANT SELECT, INSERT, UPDATE ON public.organisations TO authenticated;
GRANT ALL ON public.organisations TO service_role;


CREATE TABLE IF NOT EXISTS public.organisation_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.organisation_memberships TO authenticated;
GRANT ALL ON public.organisation_memberships TO service_role;
ALTER TABLE public.organisation_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organisation_memberships;
CREATE POLICY "Users can view their own memberships"
  ON public.organisation_memberships FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "dx_owners_manage_memberships" ON public.organisation_memberships;
CREATE POLICY "dx_owners_manage_memberships"
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
    OR (auth.uid() = user_id AND role = 'owner' AND status = 'active')
  );

-- Allow a user to insert their own owner membership at onboarding time
DROP POLICY IF EXISTS "dx_users_insert_own_owner_membership" ON public.organisation_memberships;
CREATE POLICY "dx_users_insert_own_owner_membership"
  ON public.organisation_memberships FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      role = 'owner'
      OR EXISTS (
        SELECT 1 FROM public.organisations o
        WHERE o.id = organisation_id AND o.owner_id = auth.uid()
      )
    )
  );

DROP TRIGGER IF EXISTS update_organisation_memberships_updated_at ON public.organisation_memberships;
CREATE TRIGGER update_organisation_memberships_updated_at
  BEFORE UPDATE ON public.organisation_memberships
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

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
  );
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
  END;
$$;

GRANT EXECUTE ON FUNCTION private.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.org_role(uuid, uuid) TO authenticated;


-- DeliverX org policies (additive; legacy had RLS with no usable app policies)
DROP POLICY IF EXISTS "dx_members_view_organisations" ON public.organisations;
CREATE POLICY "dx_members_view_organisations"
  ON public.organisations FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.organisation_memberships m
      WHERE m.organisation_id = organisations.id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "dx_users_create_organisations" ON public.organisations;
CREATE POLICY "dx_users_create_organisations"
  ON public.organisations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "dx_owners_update_organisations" ON public.organisations;
CREATE POLICY "dx_owners_update_organisations"
  ON public.organisations FOR UPDATE TO authenticated
  USING (
    auth.uid() = owner_id
    OR private.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.organisation_memberships m
      WHERE m.organisation_id = organisations.id
        AND m.user_id = auth.uid()
        AND m.role IN ('admin', 'owner')
        AND m.status = 'active'
    )
  )
  WITH CHECK (
    auth.uid() = owner_id
    OR private.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.organisation_memberships m
      WHERE m.organisation_id = organisations.id
        AND m.user_id = auth.uid()
        AND m.role IN ('admin', 'owner')
        AND m.status = 'active'
    )
  );


-- Capability frameworks (new tables; no conflict)
CREATE TABLE IF NOT EXISTS public.capability_frameworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  version text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, version)
);
GRANT SELECT ON public.capability_frameworks TO authenticated;
GRANT ALL ON public.capability_frameworks TO service_role;
ALTER TABLE public.capability_frameworks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Signed-in users can read frameworks" ON public.capability_frameworks;
CREATE POLICY "Signed-in users can read frameworks"
  ON public.capability_frameworks FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.framework_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id uuid NOT NULL REFERENCES public.capability_frameworks(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (framework_id, key)
);
GRANT SELECT ON public.framework_capabilities TO authenticated;
GRANT ALL ON public.framework_capabilities TO service_role;
ALTER TABLE public.framework_capabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Signed-in users can read framework capabilities" ON public.framework_capabilities;
CREATE POLICY "Signed-in users can read framework capabilities"
  ON public.framework_capabilities FOR SELECT TO authenticated USING (true);

INSERT INTO public.capability_frameworks (key, version, name, status)
VALUES ('pm-core', '2026.1', 'PM Core', 'active')
ON CONFLICT (key, version) DO NOTHING;

INSERT INTO public.framework_capabilities (framework_id, key, name, description, sort_order)
SELECT f.id, c.key, c.name, c.description, c.sort_order
FROM public.capability_frameworks f
CROSS JOIN (VALUES
  ('discovery', 'Discovery', 'Framing problems and finding evidence of need', 1),
  ('prioritisation', 'Prioritisation', 'Choosing what to do and what to drop', 2),
  ('stakeholders', 'Stakeholders', 'Mapping influence and keeping alignment', 3),
  ('delivery', 'Delivery', 'Shipping and measuring outcomes', 4),
  ('communication', 'Communication', 'Making decisions and trade-offs legible', 5),
  ('data', 'Data', 'Using evidence without overclaiming', 6)
) AS c(key, name, description, sort_order)
WHERE f.key = 'pm-core' AND f.version = '2026.1'
ON CONFLICT (framework_id, key) DO NOTHING;

-- Onboarding tables
CREATE TABLE IF NOT EXISTS public.self_report_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_kind text NOT NULL CHECK (claim_kind IN ('identity','target','strength','evidence_posture','working_style')),
  claim_key text NOT NULL,
  claim_value text NOT NULL,
  framework_capability_key text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, claim_kind, claim_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.self_report_claims TO authenticated;
GRANT ALL ON public.self_report_claims TO service_role;
ALTER TABLE public.self_report_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read own self-report claims" ON public.self_report_claims;
CREATE POLICY "Owners read own self-report claims"
  ON public.self_report_claims FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners insert own self-report claims" ON public.self_report_claims;
CREATE POLICY "Owners insert own self-report claims"
  ON public.self_report_claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners update own self-report claims" ON public.self_report_claims;
CREATE POLICY "Owners update own self-report claims"
  ON public.self_report_claims FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners delete own self-report claims" ON public.self_report_claims;
CREATE POLICY "Owners delete own self-report claims"
  ON public.self_report_claims FOR DELETE TO authenticated USING (auth.uid() = owner_id);
DROP TRIGGER IF EXISTS update_self_report_claims_updated_at ON public.self_report_claims;
CREATE TRIGGER update_self_report_claims_updated_at
  BEFORE UPDATE ON public.self_report_claims
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.pi_onboarding_state (
  owner_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 8),
  completed boolean NOT NULL DEFAULT false,
  skipped_steps integer[] NOT NULL DEFAULT '{}',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pi_onboarding_state TO authenticated;
GRANT ALL ON public.pi_onboarding_state TO service_role;
ALTER TABLE public.pi_onboarding_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read own onboarding state" ON public.pi_onboarding_state;
CREATE POLICY "Owners read own onboarding state"
  ON public.pi_onboarding_state FOR SELECT TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners insert own onboarding state" ON public.pi_onboarding_state;
CREATE POLICY "Owners insert own onboarding state"
  ON public.pi_onboarding_state FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners update own onboarding state" ON public.pi_onboarding_state;
CREATE POLICY "Owners update own onboarding state"
  ON public.pi_onboarding_state FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners delete own onboarding state" ON public.pi_onboarding_state;
CREATE POLICY "Owners delete own onboarding state"
  ON public.pi_onboarding_state FOR DELETE TO authenticated USING (auth.uid() = owner_id);
DROP TRIGGER IF EXISTS update_pi_onboarding_state_updated_at ON public.pi_onboarding_state;
CREATE TRIGGER update_pi_onboarding_state_updated_at
  BEFORE UPDATE ON public.pi_onboarding_state
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

-- Invitation soft columns for DeliverX onboarding payloads
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
