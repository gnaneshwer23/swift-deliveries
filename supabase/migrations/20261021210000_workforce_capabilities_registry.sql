-- Optional reference table for the capability catalogue.
-- Source of truth remains content/capabilities/registry.{json,yaml}.
-- UI and planner do not require this table; it is additive for future sync.

create table if not exists public.wf_capabilities (
  capability_id text primary key check (capability_id ~ '^DX-[0-9]{3}$'),
  name text not null,
  department text not null,
  department_number integer not null check (department_number between 1 and 15),
  description text not null,
  implementation_type text not null,
  lifecycle_status text not null
    check (lifecycle_status in (
      'draft', 'planned', 'implementing', 'testing', 'available', 'suspended', 'retired'
    )),
  version text not null default '0.0.0',
  tool_allowlist jsonb not null default '[]'::jsonb,
  permission_profile text not null default 'execute_internally',
  limits jsonb not null default '{}'::jsonb,
  owner text not null default 'DeliverX Platform',
  evaluation_notes text not null default '',
  known_limitations jsonb not null default '[]'::jsonb,
  activation_wave integer,
  is_agent boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists wf_capabilities_dept_idx
  on public.wf_capabilities (department_number, lifecycle_status);

create index if not exists wf_capabilities_status_idx
  on public.wf_capabilities (lifecycle_status);

alter table public.wf_capabilities enable row level security;

-- Catalogue is readable by authenticated operators; writes are service/migration only.
drop policy if exists wf_capabilities_select on public.wf_capabilities;
create policy wf_capabilities_select on public.wf_capabilities
  for select to authenticated
  using (true);

revoke all on table public.wf_capabilities from anon;
grant select on table public.wf_capabilities to authenticated;

comment on table public.wf_capabilities is
  'Optional mirror of content/capabilities registry. Planned roles must never be treated as operational.';
