-- Additive pilot-enquiry store. Clients have no grants; the server uses the
-- database role and enforces operator checks in application code.
CREATE TABLE IF NOT EXISTS public.psi_pilot_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  plan text NOT NULL CHECK (plan IN ('builder', 'founder', 'studio')),
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  organisation text NOT NULL DEFAULT '',
  brief jsonb NOT NULL,
  consent_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK (
    status IN ('received', 'reviewing', 'awaiting_customer', 'scope_agreed', 'declined', 'closed')
  ),
  follow_up_note text NOT NULL DEFAULT '',
  owner_user_id text,
  claim_token_hash text NOT NULL UNIQUE,
  brief_fingerprint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS psi_pilot_requests_email_created_idx
  ON public.psi_pilot_requests (contact_email, created_at DESC);
CREATE INDEX IF NOT EXISTS psi_pilot_requests_owner_idx
  ON public.psi_pilot_requests (owner_user_id);

REVOKE ALL ON public.psi_pilot_requests FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.psi_pilot_requests FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.psi_pilot_requests FROM authenticated';
  END IF;
END $$;

ALTER TABLE public.psi_pilot_requests ENABLE ROW LEVEL SECURITY;
