-- Phase 3a: founder-supplied evidence for a mission (docs/migrations-and-rollback.md).
-- Additive and re-runnable. Each row records what was supplied, by whom and when.
-- Only text the server could read is stored; anything else is kept as an
-- "unreadable" record with the reason, so it is reported rather than skipped.
-- Removing evidence sets removed_at; the row stays as provenance.
CREATE TABLE IF NOT EXISTS public.wf_mission_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.wf_missions (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('note', 'file')),
  -- The name roles cite it by: (Source: <title>).
  title text NOT NULL CHECK (length(title) BETWEEN 3 AND 120),
  status text NOT NULL CHECK (status IN ('readable', 'unreadable')),
  unreadable_reason text,
  content text,
  file_name text,
  media_type text,
  byte_size integer,
  content_sha256 text,
  -- Likely personal identifiers were found: never sent to an external model.
  contains_identifiers boolean NOT NULL DEFAULT false,
  supplied_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  removed_by text,
  CHECK ((status = 'readable') = (content IS NOT NULL)),
  CHECK (status = 'readable' OR unreadable_reason IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS wf_mission_evidence_mission_idx
  ON public.wf_mission_evidence (mission_id, created_at);
-- Titles are citation names, so they are unique among a mission's current evidence.
CREATE UNIQUE INDEX IF NOT EXISTS wf_mission_evidence_title_uidx
  ON public.wf_mission_evidence (mission_id, lower(title))
  WHERE removed_at IS NULL;

-- Server role only: no client grants, row-level security on.
REVOKE ALL ON public.wf_mission_evidence FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.wf_mission_evidence FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.wf_mission_evidence FROM authenticated';
  END IF;
END $$;
ALTER TABLE public.wf_mission_evidence ENABLE ROW LEVEL SECURITY;
