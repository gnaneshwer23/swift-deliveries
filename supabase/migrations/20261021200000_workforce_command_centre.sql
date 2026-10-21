-- DeliverX Stage 1: Supervised AI Workforce (Command Centre)
-- Additive only. Does not alter legacy Delivery-OS projects/tasks/artefacts/audit_events.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.wf_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Personal workspace',
  usage_ceiling integer not null default 100 check (usage_ceiling > 0),
  usage_consumed integer not null default 0 check (usage_consumed >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists wf_workspaces_owner_uidx
  on public.wf_workspaces (owner_id);

create table if not exists public.wf_workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.wf_workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'operator'
    check (role in ('operator', 'reviewer', 'viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.wf_projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.wf_workspaces (id) on delete cascade,
  name text not null,
  description text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wf_projects_workspace_idx
  on public.wf_projects (workspace_id, created_at desc);

create table if not exists public.wf_missions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.wf_workspaces (id) on delete cascade,
  project_id uuid not null references public.wf_projects (id) on delete cascade,
  intent text not null check (intent in ('investigate', 'prototype', 'improve')),
  title text not null,
  request_text text not null,
  status text not null default 'draft'
    check (status in (
      'draft',
      'needs_clarification',
      'planned',
      'awaiting_approval',
      'queued',
      'running',
      'reviewing',
      'completed',
      'partially_completed',
      'blocked',
      'failed',
      'cancelled'
    )),
  clarification_answers jsonb not null default '{}'::jsonb,
  permission_ceiling text not null default 'execute_internally'
    check (permission_ceiling in ('plan', 'create', 'execute_internally', 'act_externally')),
  external_actions_approved boolean not null default false,
  delivery_report jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wf_missions_project_idx
  on public.wf_missions (project_id, created_at desc);
create index if not exists wf_missions_workspace_idx
  on public.wf_missions (workspace_id, status);

create table if not exists public.wf_mission_plans (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null unique references public.wf_missions (id) on delete cascade,
  workspace_id uuid not null references public.wf_workspaces (id) on delete cascade,
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

create table if not exists public.wf_mission_tasks (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.wf_missions (id) on delete cascade,
  workspace_id uuid not null references public.wf_workspaces (id) on delete cascade,
  plan_id uuid references public.wf_mission_plans (id) on delete set null,
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

create index if not exists wf_mission_tasks_mission_idx
  on public.wf_mission_tasks (mission_id, sort_order);

create table if not exists public.wf_artefacts (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.wf_missions (id) on delete cascade,
  workspace_id uuid not null references public.wf_workspaces (id) on delete cascade,
  task_id uuid references public.wf_mission_tasks (id) on delete set null,
  kind text not null
    check (kind in ('brief', 'prototype_html', 'improvement_memo', 'delivery_report', 'note')),
  title text not null,
  content text not null,
  content_format text not null default 'markdown'
    check (content_format in ('markdown', 'html', 'json')),
  quality_labels text[] not null default '{}',
  evidence_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wf_artefacts_mission_idx
  on public.wf_artefacts (mission_id, created_at);

create table if not exists public.wf_approvals (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.wf_missions (id) on delete cascade,
  workspace_id uuid not null references public.wf_workspaces (id) on delete cascade,
  kind text not null check (kind in ('plan', 'external_action')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.wf_usage_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.wf_workspaces (id) on delete cascade,
  mission_id uuid references public.wf_missions (id) on delete set null,
  task_id uuid references public.wf_mission_tasks (id) on delete set null,
  amount integer not null check (amount > 0),
  label text not null,
  created_at timestamptz not null default now()
);

create index if not exists wf_usage_records_workspace_idx
  on public.wf_usage_records (workspace_id, created_at desc);

create table if not exists public.wf_audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.wf_workspaces (id) on delete cascade,
  mission_id uuid references public.wf_missions (id) on delete set null,
  actor_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists wf_audit_events_workspace_idx
  on public.wf_audit_events (workspace_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Membership helper (security definer, locked down)
-- ---------------------------------------------------------------------------

create or replace function public.wf_is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.wf_workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.wf_is_workspace_member(uuid) from public;
revoke all on function public.wf_is_workspace_member(uuid) from anon;
grant execute on function public.wf_is_workspace_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.wf_workspaces enable row level security;
alter table public.wf_workspace_members enable row level security;
alter table public.wf_projects enable row level security;
alter table public.wf_missions enable row level security;
alter table public.wf_mission_plans enable row level security;
alter table public.wf_mission_tasks enable row level security;
alter table public.wf_artefacts enable row level security;
alter table public.wf_approvals enable row level security;
alter table public.wf_usage_records enable row level security;
alter table public.wf_audit_events enable row level security;

-- Workspaces: owner can insert; members can select/update
drop policy if exists wf_workspaces_select on public.wf_workspaces;
create policy wf_workspaces_select on public.wf_workspaces
  for select to authenticated
  using (owner_id = auth.uid() or public.wf_is_workspace_member(id));

drop policy if exists wf_workspaces_insert on public.wf_workspaces;
create policy wf_workspaces_insert on public.wf_workspaces
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists wf_workspaces_update on public.wf_workspaces;
create policy wf_workspaces_update on public.wf_workspaces
  for update to authenticated
  using (owner_id = auth.uid() or public.wf_is_workspace_member(id))
  with check (owner_id = auth.uid() or public.wf_is_workspace_member(id));

-- Members
drop policy if exists wf_members_select on public.wf_workspace_members;
create policy wf_members_select on public.wf_workspace_members
  for select to authenticated
  using (user_id = auth.uid() or public.wf_is_workspace_member(workspace_id));

drop policy if exists wf_members_insert on public.wf_workspace_members;
create policy wf_members_insert on public.wf_workspace_members
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.wf_workspaces w
      where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );

-- Generic child-table policies keyed by workspace membership
drop policy if exists wf_projects_all on public.wf_projects;
create policy wf_projects_all on public.wf_projects
  for all to authenticated
  using (public.wf_is_workspace_member(workspace_id))
  with check (
    public.wf_is_workspace_member(workspace_id)
    and created_by = auth.uid()
  );

drop policy if exists wf_missions_all on public.wf_missions;
create policy wf_missions_all on public.wf_missions
  for all to authenticated
  using (public.wf_is_workspace_member(workspace_id))
  with check (public.wf_is_workspace_member(workspace_id));

drop policy if exists wf_plans_all on public.wf_mission_plans;
create policy wf_plans_all on public.wf_mission_plans
  for all to authenticated
  using (public.wf_is_workspace_member(workspace_id))
  with check (public.wf_is_workspace_member(workspace_id));

drop policy if exists wf_tasks_all on public.wf_mission_tasks;
create policy wf_tasks_all on public.wf_mission_tasks
  for all to authenticated
  using (public.wf_is_workspace_member(workspace_id))
  with check (public.wf_is_workspace_member(workspace_id));

drop policy if exists wf_artefacts_all on public.wf_artefacts;
create policy wf_artefacts_all on public.wf_artefacts
  for all to authenticated
  using (public.wf_is_workspace_member(workspace_id))
  with check (public.wf_is_workspace_member(workspace_id));

drop policy if exists wf_approvals_all on public.wf_approvals;
create policy wf_approvals_all on public.wf_approvals
  for all to authenticated
  using (public.wf_is_workspace_member(workspace_id))
  with check (public.wf_is_workspace_member(workspace_id));

drop policy if exists wf_usage_all on public.wf_usage_records;
create policy wf_usage_all on public.wf_usage_records
  for all to authenticated
  using (public.wf_is_workspace_member(workspace_id))
  with check (public.wf_is_workspace_member(workspace_id));

drop policy if exists wf_audit_select on public.wf_audit_events;
create policy wf_audit_select on public.wf_audit_events
  for select to authenticated
  using (public.wf_is_workspace_member(workspace_id));

drop policy if exists wf_audit_insert on public.wf_audit_events;
create policy wf_audit_insert on public.wf_audit_events
  for insert to authenticated
  with check (public.wf_is_workspace_member(workspace_id));

-- No anon access
revoke all on public.wf_workspaces from anon;
revoke all on public.wf_workspace_members from anon;
revoke all on public.wf_projects from anon;
revoke all on public.wf_missions from anon;
revoke all on public.wf_mission_plans from anon;
revoke all on public.wf_mission_tasks from anon;
revoke all on public.wf_artefacts from anon;
revoke all on public.wf_approvals from anon;
revoke all on public.wf_usage_records from anon;
revoke all on public.wf_audit_events from anon;

grant select, insert, update, delete on public.wf_workspaces to authenticated;
grant select, insert, update, delete on public.wf_workspace_members to authenticated;
grant select, insert, update, delete on public.wf_projects to authenticated;
grant select, insert, update, delete on public.wf_missions to authenticated;
grant select, insert, update, delete on public.wf_mission_plans to authenticated;
grant select, insert, update, delete on public.wf_mission_tasks to authenticated;
grant select, insert, update, delete on public.wf_artefacts to authenticated;
grant select, insert, update, delete on public.wf_approvals to authenticated;
grant select, insert, update, delete on public.wf_usage_records to authenticated;
grant select, insert on public.wf_audit_events to authenticated;
