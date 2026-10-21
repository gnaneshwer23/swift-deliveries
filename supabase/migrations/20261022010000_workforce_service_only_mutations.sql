-- Enforce service-role-only mutations across all Stage 1 workforce tables.
-- Prevents authenticated clients from directly forging wf_missions.status,
-- wf_mission_plans, wf_mission_tasks, or wf_artefacts.quality_labels via PostgREST.
-- All mutations are mediated by verified server functions in src/lib/workforce.functions.ts.

revoke all on public.wf_projects from authenticated, anon;
revoke all on public.wf_missions from authenticated, anon;
revoke all on public.wf_mission_plans from authenticated, anon;
revoke all on public.wf_mission_tasks from authenticated, anon;
revoke all on public.wf_artefacts from authenticated, anon;

grant select on public.wf_projects to authenticated;
grant select on public.wf_missions to authenticated;
grant select on public.wf_mission_plans to authenticated;
grant select on public.wf_mission_tasks to authenticated;
grant select on public.wf_artefacts to authenticated;

drop policy if exists wf_projects_all on public.wf_projects;
drop policy if exists wf_projects_select on public.wf_projects;
create policy wf_projects_select on public.wf_projects
  for select to authenticated
  using (public.wf_is_workspace_member(workspace_id));

drop policy if exists wf_missions_all on public.wf_missions;
drop policy if exists wf_missions_select on public.wf_missions;
create policy wf_missions_select on public.wf_missions
  for select to authenticated
  using (public.wf_is_workspace_member(workspace_id));

drop policy if exists wf_plans_all on public.wf_mission_plans;
drop policy if exists wf_plans_select on public.wf_mission_plans;
create policy wf_plans_select on public.wf_mission_plans
  for select to authenticated
  using (public.wf_is_workspace_member(workspace_id));

drop policy if exists wf_tasks_all on public.wf_mission_tasks;
drop policy if exists wf_tasks_select on public.wf_mission_tasks;
create policy wf_tasks_select on public.wf_mission_tasks
  for select to authenticated
  using (public.wf_is_workspace_member(workspace_id));

drop policy if exists wf_artefacts_all on public.wf_artefacts;
drop policy if exists wf_artefacts_select on public.wf_artefacts;
create policy wf_artefacts_select on public.wf_artefacts
  for select to authenticated
  using (public.wf_is_workspace_member(workspace_id));
