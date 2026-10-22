-- DXSI programmes: idea / business case → end-to-end product programme run by
-- the 150-role workforce (docs/dxsi-programmes.md). Additive only.
--
-- Writes are service-role only (trusted server code); workspace members read
-- through RLS. Programme records are append-only: history is never rewritten.
-- Apply after 20261022100000_dxsi_product_mission.sql.

create table if not exists public.wf_programmes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.wf_workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
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

create index if not exists wf_programmes_workspace_idx
  on public.wf_programmes (workspace_id, created_at desc);

create table if not exists public.wf_programme_records (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.wf_programmes (id) on delete cascade,
  workspace_id uuid not null references public.wf_workspaces (id) on delete cascade,
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

create index if not exists wf_programme_records_programme_idx
  on public.wf_programme_records (programme_id, created_at, id);

-- Append-only: records may be removed only with their programme (cascade).
create or replace function public.wf_programme_records_append_only()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'wf_programme_records is append-only';
end;
$$;

drop trigger if exists wf_programme_records_no_update on public.wf_programme_records;
create trigger wf_programme_records_no_update
  before update on public.wf_programme_records
  for each row execute function public.wf_programme_records_append_only();

alter table public.wf_programmes enable row level security;
alter table public.wf_programme_records enable row level security;

drop policy if exists wf_programmes_select on public.wf_programmes;
create policy wf_programmes_select on public.wf_programmes
  for select to authenticated
  using (public.wf_is_workspace_member(workspace_id));

drop policy if exists wf_programme_records_select on public.wf_programme_records;
create policy wf_programme_records_select on public.wf_programme_records
  for select to authenticated
  using (public.wf_is_workspace_member(workspace_id));

revoke all on public.wf_programmes from anon, authenticated;
revoke all on public.wf_programme_records from anon, authenticated;
grant select on public.wf_programmes to authenticated;
grant select on public.wf_programme_records to authenticated;

create or replace function public.wf_schema_version()
returns integer
language sql
immutable
set search_path = public
as $$ select 3 $$;

revoke all on function public.wf_schema_version() from public;
revoke all on function public.wf_schema_version() from anon;
revoke all on function public.wf_schema_version() from authenticated;
grant execute on function public.wf_schema_version() to service_role;
