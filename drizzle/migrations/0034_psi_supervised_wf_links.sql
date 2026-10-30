-- Phase A1: authoritative link between Studio supervised missions and wf worker jobs.
-- Additive and re-runnable. Human plan approval and usage ceilings remain on psi_* / mission document.

CREATE TABLE IF NOT EXISTS public.psi_supervised_wf_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  supervised_mission_id uuid NOT NULL REFERENCES public.psi_supervised_missions (id) ON DELETE CASCADE,
  wf_mission_id uuid NOT NULL REFERENCES public.wf_missions (id) ON DELETE CASCADE,
  link_kind text NOT NULL DEFAULT 'research_pass'
    CHECK (link_kind IN ('research_pass')),
  team_scope_hash text NOT NULL,
  team_approved_at timestamptz NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supervised_mission_id, link_kind, team_scope_hash)
);

CREATE INDEX IF NOT EXISTS psi_supervised_wf_links_supervised_idx
  ON public.psi_supervised_wf_links (supervised_mission_id, status);

CREATE INDEX IF NOT EXISTS psi_supervised_wf_links_wf_mission_idx
  ON public.psi_supervised_wf_links (wf_mission_id);

REVOKE ALL ON public.psi_supervised_wf_links FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.psi_supervised_wf_links FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.psi_supervised_wf_links FROM authenticated';
  END IF;
END $$;

ALTER TABLE public.psi_supervised_wf_links ENABLE ROW LEVEL SECURITY;
