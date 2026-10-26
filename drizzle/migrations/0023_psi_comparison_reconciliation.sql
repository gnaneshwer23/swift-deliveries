-- One immutable operator disposition per reservation. No automatic refunds.
CREATE TABLE IF NOT EXISTS public.psi_comparison_reconciliations (
  mission_id uuid NOT NULL,
  spend_key text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('charged', 'not_dispatched')),
  operator_id text NOT NULL,
  evidence_note text NOT NULL CHECK (length(trim(evidence_note)) BETWEEN 20 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (mission_id, spend_key),
  FOREIGN KEY (mission_id, spend_key)
    REFERENCES public.psi_comparison_reservations(mission_id, spend_key)
);
REVOKE ALL ON public.psi_comparison_reconciliations FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public.psi_comparison_reconciliations FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public.psi_comparison_reconciliations FROM authenticated;
  END IF;
END $$;
ALTER TABLE public.psi_comparison_reconciliations ENABLE ROW LEVEL SECURITY;
