-- Manual pilot activation for one workspace and one scoped plan.
-- Committed and NOT applied to the live database by this change.
-- Depends on drizzle/migrations/0019_psi_pilot_requests.sql, which is also unapplied.
-- payment_taken is constrained false: this table does not record a Stripe charge.

CREATE TABLE IF NOT EXISTS public.psi_pilot_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES public.psi_pilot_requests (id),
  workspace_id uuid NOT NULL UNIQUE,
  plan text NOT NULL CHECK (plan IN ('builder', 'founder', 'studio')),
  mission_allowance integer NOT NULL CHECK (mission_allowance >= 1 AND mission_allowance <= 24),
  missions_consumed integer NOT NULL DEFAULT 0 CHECK (missions_consumed >= 0 AND missions_consumed <= mission_allowance),
  payment_taken boolean NOT NULL DEFAULT false CHECK (payment_taken = false),
  exhaustion text NOT NULL DEFAULT 'block_next_billable_comparison'
    CHECK (exhaustion = 'block_next_billable_comparison'),
  activated_by text NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS psi_pilot_activations_request_idx
  ON public.psi_pilot_activations (request_id);

REVOKE ALL ON public.psi_pilot_activations FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.psi_pilot_activations FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.psi_pilot_activations FROM authenticated';
  END IF;
END $$;

ALTER TABLE public.psi_pilot_activations ENABLE ROW LEVEL SECURITY;
