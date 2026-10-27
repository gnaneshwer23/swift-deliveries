-- Test fixture for a new, explicitly isolated local database; not a production migration.
CREATE TABLE IF NOT EXISTS public.wf_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL UNIQUE,
  usage_ceiling integer NOT NULL DEFAULT 10,
  usage_consumed integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Workforce mission tables for the workspace-isolation tests
-- (src/lib/workforce/access.server.test.ts). Columns, defaults, CHECKs, UNIQUEs
-- and foreign keys follow the production Neon schema as read on 26 Oct 2026.
-- Reduced fixture: the programme tables are omitted, and
-- the wf_workspaces table above keeps its fixture-only UNIQUE (owner_id).
ALTER TABLE public.wf_workspaces ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Personal workspace';

CREATE TABLE IF NOT EXISTS public.wf_workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL DEFAULT 'operator' CHECK (role IN ('operator', 'reviewer', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
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
  intent text NOT NULL CHECK (intent IN ('investigate', 'prototype', 'improve', 'build')),
  title text NOT NULL,
  request_text text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'needs_clarification', 'planned',
    'awaiting_approval', 'queued', 'running', 'reviewing', 'completed', 'partially_completed',
    'blocked', 'failed', 'cancelled')),
  clarification_answers jsonb NOT NULL DEFAULT '{}',
  permission_ceiling text NOT NULL DEFAULT 'execute_internally'
    CHECK (permission_ceiling IN ('plan', 'create', 'execute_internally', 'act_externally')),
  external_actions_approved boolean NOT NULL DEFAULT false,
  delivery_report jsonb,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wf_mission_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL UNIQUE REFERENCES public.wf_missions (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  summary text NOT NULL,
  estimated_usage integer NOT NULL DEFAULT 0,
  required_permission text NOT NULL
    CHECK (required_permission IN ('plan', 'create', 'execute_internally', 'act_externally')),
  includes_external_actions boolean NOT NULL DEFAULT false,
  clarification_questions jsonb NOT NULL DEFAULT '[]',
  acceptance_criteria jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wf_mission_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.wf_missions (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.wf_mission_plans (id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  acceptance_criteria text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'skipped', 'blocked', 'failed')),
  permission_required text NOT NULL DEFAULT 'execute_internally'
    CHECK (permission_required IN ('plan', 'create', 'execute_internally', 'act_externally')),
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
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.wf_mission_tasks (id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('brief', 'prototype_html', 'improvement_memo',
    'delivery_report', 'note', 'mission_charter', 'research_dossier', 'tech_radar', 'prd',
    'design_spec', 'architecture', 'test_report', 'release_pack', 'evolution_plan')),
  title text NOT NULL,
  content text NOT NULL,
  content_format text NOT NULL DEFAULT 'markdown' CHECK (content_format IN ('markdown', 'html', 'json')),
  quality_labels text[] NOT NULL DEFAULT '{}',
  evidence_items jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wf_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.wf_missions (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('plan', 'external_action')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by text,
  decided_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.wf_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  mission_id uuid REFERENCES public.wf_missions (id) ON DELETE SET NULL,
  actor_id text,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wf_usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  mission_id uuid REFERENCES public.wf_missions (id) ON DELETE SET NULL,
  task_id uuid,
  amount integer NOT NULL,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
