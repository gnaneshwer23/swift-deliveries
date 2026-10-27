-- Phase 3b: product memory across missions (docs/migrations-and-rollback.md).
-- Additive and re-runnable. Also tightens 0027 (founder evidence): its
-- mission must belong to its workspace, and readable rows must carry a hash.

-- A mission or project is identified within its workspace, so rows that point at
-- one can be held to the same workspace by a composite foreign key.
CREATE UNIQUE INDEX IF NOT EXISTS wf_missions_id_workspace_uidx
  ON public.wf_missions (id, workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS wf_projects_id_workspace_uidx
  ON public.wf_projects (id, workspace_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wf_mission_evidence_mission_workspace_fkey'
  ) THEN
    ALTER TABLE public.wf_mission_evidence
      ADD CONSTRAINT wf_mission_evidence_mission_workspace_fkey
      FOREIGN KEY (mission_id, workspace_id)
      REFERENCES public.wf_missions (id, workspace_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wf_mission_evidence_hash_check'
  ) THEN
    ALTER TABLE public.wf_mission_evidence
      ADD CONSTRAINT wf_mission_evidence_hash_check
      CHECK ((status = 'readable') = (content_sha256 IS NOT NULL));
  END IF;
END $$;

-- Product memory: what the team has learned about one product (a project), kept
-- across missions. Entries are taken from accepted model-written artefacts, the
-- founder's gate decisions and the founder's evidence. Each keeps the label it was
-- written with, where it came from, and when it was last seen. Re-observing an
-- entry updates it rather than duplicating it. Retired entries stay as history.
CREATE TABLE IF NOT EXISTS public.wf_product_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN (
    'source', 'sourced_fact', 'assumption', 'inference', 'speculation', 'requirement', 'decision')),
  statement text NOT NULL CHECK (length(statement) BETWEEN 1 AND 600),
  -- For a sourced fact, the source it cites; for a requirement, its ID; for a decision, the gate.
  citation text,
  ref_key text,
  statement_hash text NOT NULL,
  origin_kind text NOT NULL CHECK (origin_kind IN ('evidence', 'artefact', 'gate')),
  origin_id text NOT NULL,
  first_mission_id uuid REFERENCES public.wf_missions (id) ON DELETE SET NULL,
  last_mission_id uuid REFERENCES public.wf_missions (id) ON DELETE SET NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  times_seen integer NOT NULL DEFAULT 1 CHECK (times_seen >= 1),
  retired_at timestamptz,
  retired_reason text,
  FOREIGN KEY (project_id, workspace_id)
    REFERENCES public.wf_projects (id, workspace_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS wf_product_memory_current_uidx
  ON public.wf_product_memory (project_id, kind, statement_hash)
  WHERE retired_at IS NULL;
CREATE INDEX IF NOT EXISTS wf_product_memory_project_idx
  ON public.wf_product_memory (project_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS wf_product_memory_origin_idx
  ON public.wf_product_memory (origin_kind, origin_id);

-- Server role only: no client grants, row-level security on.
REVOKE ALL ON public.wf_product_memory FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.wf_product_memory FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.wf_product_memory FROM authenticated';
  END IF;
END $$;
ALTER TABLE public.wf_product_memory ENABLE ROW LEVEL SECURITY;
