-- Test fixture for a new, explicitly isolated local database; not a production migration.
CREATE TABLE IF NOT EXISTS public.wf_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL UNIQUE,
  usage_ceiling integer NOT NULL DEFAULT 10,
  usage_consumed integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
