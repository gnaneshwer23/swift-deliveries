-- Phase 3c: conflicting evidence is kept and flagged (docs/migrations-and-rollback.md).
-- Additive and re-runnable. A conflict links two product-memory entries that
-- cannot both be true. Neither entry is changed or merged: both stay, the
-- conflict is shown with them, and missions are told to state it rather than
-- average it away. Resolving a conflict records the founder's reasoning; it
-- never deletes either side.
CREATE TABLE IF NOT EXISTS public.wf_memory_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  -- Stored in a fixed order, so one pair has one row.
  entry_low uuid NOT NULL REFERENCES public.wf_product_memory (id) ON DELETE CASCADE,
  entry_high uuid NOT NULL REFERENCES public.wf_product_memory (id) ON DELETE CASCADE,
  note text CHECK (note IS NULL OR length(note) <= 1000),
  flagged_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by text,
  resolution text CHECK (resolution IS NULL OR length(resolution) BETWEEN 3 AND 1000),
  CHECK (entry_low < entry_high),
  CHECK ((resolved_at IS NULL) = (resolution IS NULL)),
  FOREIGN KEY (project_id, workspace_id)
    REFERENCES public.wf_projects (id, workspace_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS wf_memory_conflicts_open_uidx
  ON public.wf_memory_conflicts (entry_low, entry_high)
  WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS wf_memory_conflicts_project_idx
  ON public.wf_memory_conflicts (project_id, created_at);

-- Server role only: no client grants, row-level security on.
REVOKE ALL ON public.wf_memory_conflicts FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.wf_memory_conflicts FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.wf_memory_conflicts FROM authenticated';
  END IF;
END $$;
ALTER TABLE public.wf_memory_conflicts ENABLE ROW LEVEL SECURITY;
