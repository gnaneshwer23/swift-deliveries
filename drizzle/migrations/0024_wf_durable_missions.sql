-- Phase 1a: durable mission foundations (docs/migrations-and-rollback.md).
-- Additive and re-runnable. Adds real task columns, plan versions, approvals
-- bound to the plan they approve, a run ledger, an append-only event log, a
-- paused mission state and a workspace emergency stop. Existing rows keep
-- working: the app falls back to metadata encoded in task descriptions when
-- the new task columns are empty.

-- Tasks: graph and specialist data as columns, plus lease fields for the worker.
ALTER TABLE public.wf_mission_tasks
  ADD COLUMN IF NOT EXISTS task_key text,
  ADD COLUMN IF NOT EXISTS depends_on text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capability_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lease_owner text,
  ADD COLUMN IF NOT EXISTS lease_until timestamptz;
CREATE INDEX IF NOT EXISTS wf_mission_tasks_dispatch_idx
  ON public.wf_mission_tasks (workspace_id, status, lease_until);

-- Plans: every change bumps the version and records a fingerprint of what is shown.
ALTER TABLE public.wf_mission_plans
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS plan_hash text;

-- Approvals: bound to one plan version and fingerprint, a cost limit and an expiry.
-- Superseded approvals are invalidated and kept, never deleted.
ALTER TABLE public.wf_approvals
  ADD COLUMN IF NOT EXISTS plan_version integer,
  ADD COLUMN IF NOT EXISTS payload_hash text,
  ADD COLUMN IF NOT EXISTS cost_limit integer,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS invalidated_at timestamptz,
  ADD COLUMN IF NOT EXISTS invalidated_reason text;

-- Missions may be paused by their owner.
DO $$
BEGIN
  ALTER TABLE public.wf_missions DROP CONSTRAINT IF EXISTS wf_missions_status_check;
  ALTER TABLE public.wf_missions ADD CONSTRAINT wf_missions_status_check CHECK (status IN (
    'draft', 'needs_clarification', 'planned', 'awaiting_approval', 'queued', 'running',
    'reviewing', 'paused', 'completed', 'partially_completed', 'blocked', 'failed', 'cancelled'));
END $$;

-- Workspace emergency stop: no new work starts while stopped_at is set.
ALTER TABLE public.wf_workspaces
  ADD COLUMN IF NOT EXISTS stopped_at timestamptz,
  ADD COLUMN IF NOT EXISTS stopped_by text,
  ADD COLUMN IF NOT EXISTS stop_reason text;

-- One workspace per owner. Created only when no duplicates exist; if any do,
-- the index is skipped and the app's advisory lock still prevents new ones.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.wf_workspaces GROUP BY owner_id HAVING count(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS wf_workspaces_owner_id_unique ON public.wf_workspaces (owner_id);
  END IF;
END $$;

-- Run ledger: one row per execution attempt of a task.
CREATE TABLE IF NOT EXISTS public.wf_task_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.wf_missions (id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.wf_mission_tasks (id) ON DELETE CASCADE,
  attempt integer NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  worker_id text NOT NULL,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'abandoned')),
  provider text,
  model text,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  request_id text,
  failure_class text,
  detail text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  UNIQUE (task_id, attempt)
);
CREATE INDEX IF NOT EXISTS wf_task_runs_mission_idx ON public.wf_task_runs (mission_id, started_at);

-- Event log: append-only, ordered by id, read by cursor.
CREATE TABLE IF NOT EXISTS public.wf_mission_events (
  id bigserial PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  mission_id uuid REFERENCES public.wf_missions (id) ON DELETE CASCADE,
  task_id uuid,
  type text NOT NULL,
  actor_kind text NOT NULL CHECK (actor_kind IN ('user', 'worker', 'system')),
  actor_id text,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wf_mission_events_mission_idx ON public.wf_mission_events (mission_id, id);
CREATE INDEX IF NOT EXISTS wf_mission_events_workspace_idx ON public.wf_mission_events (workspace_id, id);

CREATE OR REPLACE FUNCTION public.wf_mission_events_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'wf_mission_events is append-only';
END $$;
DROP TRIGGER IF EXISTS wf_mission_events_append_only ON public.wf_mission_events;
CREATE TRIGGER wf_mission_events_append_only
  BEFORE UPDATE OR DELETE ON public.wf_mission_events
  FOR EACH ROW EXECUTE FUNCTION public.wf_mission_events_append_only();

-- Server role only: no client grants, row-level security on.
REVOKE ALL ON public.wf_task_runs FROM PUBLIC;
REVOKE ALL ON public.wf_mission_events FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.wf_task_runs, public.wf_mission_events FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.wf_task_runs, public.wf_mission_events FROM authenticated';
  END IF;
END $$;
ALTER TABLE public.wf_task_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wf_mission_events ENABLE ROW LEVEL SECURITY;

-- The app probes this to know the durable-mission schema is present.
CREATE OR REPLACE FUNCTION public.wf_schema_version()
RETURNS integer LANGUAGE sql IMMUTABLE AS $$ SELECT 4 $$;
