-- DeliverX core schema on Neon Postgres.
-- Migrated from Supabase (wf_* workforce, programmes, monitoring).
-- Users and sessions live in Neon Auth (`neon_auth` schema); user ids are text.
-- Access control is enforced by server code using the verified user id;
-- the database is reached only by the server with DATABASE_URL.

create table if not exists wf_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  name text not null default 'Personal workspace',
  usage_ceiling integer not null default 100 check (usage_ceiling > 0),
  usage_consumed integer not null default 0 check (usage_consumed >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists wf_workspaces_owner_uidx on wf_workspaces (owner_id);

create table if not exists wf_workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wf_workspaces (id) on delete cascade,
  user_id text not null,
  role text not null default 'operator' check (role in ('operator', 'reviewer', 'viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists wf_projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wf_workspaces (id) on delete cascade,
  name text not null,
  description text,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wf_projects_workspace_idx on wf_projects (workspace_id, created_at desc);

create table if not exists wf_missions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wf_workspaces (id) on delete cascade,
  project_id uuid not null references wf_projects (id) on delete cascade,
  intent text not null check (intent in ('investigate', 'prototype', 'improve', 'build')),
  title text not null,
  request_text text not null,
  status text not null default 'draft' check (status in (
    'draft', 'needs_clarification', 'planned', 'awaiting_approval', 'queued', 'running',
    'reviewing', 'completed', 'partially_completed', 'blocked', 'failed', 'cancelled')),
  clarification_answers jsonb not null default '{}'::jsonb,
  permission_ceiling text not null default 'execute_internally'
    check (permission_ceiling in ('plan', 'create', 'execute_internally', 'act_externally')),
  external_actions_approved boolean not null default false,
  delivery_report jsonb,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wf_missions_project_idx on wf_missions (project_id, created_at desc);
create index if not exists wf_missions_workspace_idx on wf_missions (workspace_id, status);

create table if not exists wf_mission_plans (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null unique references wf_missions (id) on delete cascade,
  workspace_id uuid not null references wf_workspaces (id) on delete cascade,
  summary text not null,
  estimated_usage integer not null default 0,
  required_permission text not null
    check (required_permission in ('plan', 'create', 'execute_internally', 'act_externally')),
  includes_external_actions boolean not null default false,
  clarification_questions jsonb not null default '[]'::jsonb,
  acceptance_criteria jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wf_mission_tasks (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references wf_missions (id) on delete cascade,
  workspace_id uuid not null references wf_workspaces (id) on delete cascade,
  plan_id uuid references wf_mission_plans (id) on delete set null,
  sort_order integer not null default 0,
  title text not null,
  description text not null default '',
  acceptance_criteria text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'skipped', 'blocked', 'failed')),
  permission_required text not null default 'execute_internally'
    check (permission_required in ('plan', 'create', 'execute_internally', 'act_externally')),
  is_external boolean not null default false,
  estimated_usage integer not null default 0,
  actual_usage integer not null default 0,
  evidence_notes jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wf_mission_tasks_mission_idx on wf_mission_tasks (mission_id, sort_order);

create table if not exists wf_artefacts (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references wf_missions (id) on delete cascade,
  workspace_id uuid not null references wf_workspaces (id) on delete cascade,
  task_id uuid references wf_mission_tasks (id) on delete set null,
  kind text not null check (kind in (
    'brief', 'prototype_html', 'improvement_memo', 'delivery_report', 'note', 'mission_charter',
    'research_dossier', 'tech_radar', 'prd', 'design_spec', 'architecture', 'test_report',
    'release_pack', 'evolution_plan')),
  title text not null,
  content text not null,
  content_format text not null default 'markdown' check (content_format in ('markdown', 'html', 'json')),
  quality_labels text[] not null default '{}',
  evidence_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wf_artefacts_mission_idx on wf_artefacts (mission_id, created_at);

create table if not exists wf_approvals (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references wf_missions (id) on delete cascade,
  workspace_id uuid not null references wf_workspaces (id) on delete cascade,
  kind text not null check (kind in ('plan', 'external_action')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by text,
  decided_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists wf_usage_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wf_workspaces (id) on delete cascade,
  mission_id uuid references wf_missions (id) on delete set null,
  task_id uuid references wf_mission_tasks (id) on delete set null,
  amount integer not null check (amount > 0),
  label text not null,
  created_at timestamptz not null default now()
);
create index if not exists wf_usage_records_workspace_idx on wf_usage_records (workspace_id, created_at desc);

create table if not exists wf_audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wf_workspaces (id) on delete cascade,
  mission_id uuid references wf_missions (id) on delete set null,
  actor_id text,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists wf_audit_events_workspace_idx on wf_audit_events (workspace_id, created_at desc);

create table if not exists wf_programmes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wf_workspaces (id) on delete cascade,
  created_by text not null,
  title text not null,
  status text not null default 'active'
    check (status in ('draft', 'active', 'awaiting_human', 'completed', 'partially_completed', 'cancelled')),
  business_case jsonb not null,
  state jsonb not null,
  version integer not null default 1,
  budget_ceiling integer not null check (budget_ceiling > 0),
  budget_consumed integer not null default 0 check (budget_consumed >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wf_programmes_workspace_idx on wf_programmes (workspace_id, created_at desc);

create table if not exists wf_programme_records (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references wf_programmes (id) on delete cascade,
  workspace_id uuid not null references wf_workspaces (id) on delete cascade,
  kind text not null
    check (kind in ('artefact', 'meeting', 'decision', 'interviews', 'review', 'event', 'human_input')),
  item_key text,
  title text not null,
  body text not null default '',
  format text not null default 'markdown' check (format in ('markdown', 'html', 'json')),
  actor text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists wf_programme_records_programme_idx on wf_programme_records (programme_id, created_at, id);

create or replace function wf_programme_records_append_only() returns trigger
language plpgsql as $$
begin
  raise exception 'wf_programme_records is append-only';
end;
$$;
drop trigger if exists wf_programme_records_no_update on wf_programme_records;
create trigger wf_programme_records_no_update before update on wf_programme_records
  for each row execute function wf_programme_records_append_only();

-- Onboarding answers (was Supabase user_metadata.dx_profile).
create table if not exists dx_profiles (
  user_id text primary key,
  full_name text not null default '',
  role text not null default '',
  team_size text not null default '',
  goal text not null default '',
  first_idea text not null default '',
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists monitoring_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  severity text not null,
  environment text not null,
  source text not null,
  message text not null,
  route text,
  user_id text,
  fingerprint text,
  detail jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists monitoring_events_time_idx on monitoring_events (occurred_at desc);

create or replace function wf_schema_version() returns integer
language sql immutable as $$ select 3 $$;
