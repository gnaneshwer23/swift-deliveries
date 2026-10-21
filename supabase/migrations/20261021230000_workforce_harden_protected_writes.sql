-- Harden Stage 1 workforce tables: budget, approval, permission and audit state
-- may only be written by trusted server code (service role), never directly by
-- workspace members through PostgREST. Additive and non-destructive.
--
-- DEPLOY ORDER: ship the application build that uses the service-role client
-- (src/lib/workforce.functions.ts `adminDb()`) BEFORE applying this migration.

-- 1. Remove direct write access for authenticated users on protected tables.
-- (Supabase default grants also include TRUNCATE/REFERENCES/TRIGGER, and
-- TRUNCATE bypasses RLS, so revoke everything then re-grant read-only.)
revoke all on public.wf_workspaces from authenticated;
revoke all on public.wf_workspace_members from authenticated;
revoke all on public.wf_approvals from authenticated;
revoke all on public.wf_usage_records from authenticated;
revoke all on public.wf_audit_events from authenticated;
grant select on public.wf_workspaces to authenticated;
grant select on public.wf_workspace_members to authenticated;
grant select on public.wf_approvals to authenticated;
grant select on public.wf_usage_records to authenticated;
grant select on public.wf_audit_events to authenticated;

-- Remaining wf_* tables stay user-writable under RLS, but never TRUNCATE etc.
revoke truncate, references, trigger on
  public.wf_projects, public.wf_missions, public.wf_mission_plans,
  public.wf_mission_tasks, public.wf_artefacts, public.wf_capabilities
from authenticated, anon;

-- 2. Missions stay user-writable (title, answers, status) but approval and
--    permission columns are pinned for non-service callers.
create or replace function public.wf_guard_mission_protected_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- PostgREST sets current_user to authenticated/anon for client requests;
  -- service_role and migration/superuser roles are trusted.
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.external_actions_approved := false;
      new.permission_ceiling := 'execute_internally';
    else
      new.external_actions_approved := old.external_actions_approved;
      new.permission_ceiling := old.permission_ceiling;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists wf_missions_guard_protected on public.wf_missions;
create trigger wf_missions_guard_protected
  before insert or update on public.wf_missions
  for each row execute function public.wf_guard_mission_protected_columns();
