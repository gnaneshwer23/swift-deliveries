-- Additive supervised-mission store for the bounded pilot path.
-- Not applied to the live Neon database by this change.
-- The server role reads and writes these tables. Workspace isolation is
-- enforced in application queries, and clients have no grants.

CREATE TABLE IF NOT EXISTS public.psi_supervised_missions (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  owner_user_id text NOT NULL,
  version integer NOT NULL,
  stage text NOT NULL,
  job_status text NOT NULL,
  usage_consumed integer NOT NULL,
  usage_ceiling integer NOT NULL,
  document jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS psi_supervised_missions_workspace_idx
  ON public.psi_supervised_missions (workspace_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.psi_supervised_spend (
  mission_id uuid NOT NULL REFERENCES public.psi_supervised_missions (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  spend_key text NOT NULL,
  units integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (mission_id, spend_key)
);

REVOKE ALL ON public.psi_supervised_missions FROM PUBLIC;
REVOKE ALL ON public.psi_supervised_spend FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.psi_supervised_missions FROM anon';
    EXECUTE 'REVOKE ALL ON public.psi_supervised_spend FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.psi_supervised_missions FROM authenticated';
    EXECUTE 'REVOKE ALL ON public.psi_supervised_spend FROM authenticated';
  END IF;
END $$;

ALTER TABLE public.psi_supervised_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psi_supervised_spend ENABLE ROW LEVEL SECURITY;
