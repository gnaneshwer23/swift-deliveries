-- Test fixture for a new, explicitly isolated local database; not a production migration.
CREATE TABLE IF NOT EXISTS public.wf_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL UNIQUE,
  usage_ceiling integer NOT NULL DEFAULT 10,
  usage_consumed integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Workforce mission tables, column-for-column with production, for the
-- workspace-isolation tests (src/lib/workforce/access.server.test.ts).
ALTER TABLE public.wf_workspaces ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Personal workspace';

CREATE TABLE IF NOT EXISTS public.wf_workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wf_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wf_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.wf_projects (id) ON DELETE CASCADE,
  intent text NOT NULL,
  title text NOT NULL,
  request_text text NOT NULL,
  status text NOT NULL,
  clarification_answers jsonb NOT NULL DEFAULT '{}',
  permission_ceiling text NOT NULL,
  external_actions_approved boolean NOT NULL DEFAULT false,
  delivery_report jsonb,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wf_mission_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.wf_missions (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  summary text NOT NULL,
  estimated_usage integer NOT NULL DEFAULT 0,
  required_permission text NOT NULL,
  includes_external_actions boolean NOT NULL DEFAULT false,
  clarification_questions jsonb NOT NULL DEFAULT '[]',
  acceptance_criteria jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wf_mission_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.wf_missions (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  plan_id uuid,
  sort_order integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  acceptance_criteria text NOT NULL DEFAULT '',
  status text NOT NULL,
  permission_required text NOT NULL,
  is_external boolean NOT NULL DEFAULT false,
  estimated_usage integer NOT NULL DEFAULT 0,
  actual_usage integer NOT NULL DEFAULT 0,
  evidence_notes jsonb NOT NULL DEFAULT '[]',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wf_artefacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.wf_missions (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  task_id uuid,
  kind text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  content_format text NOT NULL,
  quality_labels text[] NOT NULL DEFAULT '{}',
  evidence_items jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wf_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.wf_missions (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  kind text NOT NULL,
  status text NOT NULL,
  decided_by text,
  decided_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wf_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  mission_id uuid,
  actor_id text NOT NULL,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
