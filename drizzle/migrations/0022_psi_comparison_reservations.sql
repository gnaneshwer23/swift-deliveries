-- Additive operation ledger. Apply in an isolated environment before enabling provider execution.
-- Reserved/uncertain attempts are never automatically refunded or retried: the provider may have billed them.
CREATE TABLE IF NOT EXISTS public.psi_comparison_reservations (
  mission_id uuid NOT NULL REFERENCES public.psi_supervised_missions(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces(id) ON DELETE CASCADE,
  spend_key text NOT NULL,
  requested_by text NOT NULL,
  scope_hash text NOT NULL,
  consented_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK(status IN ('reserved','completed','uncertain','released')),
  units integer NOT NULL CHECK(units > 0),
  activation_id uuid REFERENCES public.psi_pilot_activations(id),
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(mission_id, spend_key)
);
CREATE INDEX IF NOT EXISTS psi_comparison_reservations_review_idx
  ON public.psi_comparison_reservations(workspace_id,status);
REVOKE ALL ON public.psi_comparison_reservations FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public.psi_comparison_reservations FROM anon;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public.psi_comparison_reservations FROM authenticated;
  END IF;
END $$;
ALTER TABLE public.psi_comparison_reservations ENABLE ROW LEVEL SECURITY;
