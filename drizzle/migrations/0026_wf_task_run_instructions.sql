-- Phase 2c: record which role and instruction version each run used
-- (docs/migrations-and-rollback.md). Additive and re-runnable.
ALTER TABLE public.wf_task_runs
  ADD COLUMN IF NOT EXISTS role_id text,
  ADD COLUMN IF NOT EXISTS instruction_version text,
  ADD COLUMN IF NOT EXISTS model_calls integer NOT NULL DEFAULT 0;
