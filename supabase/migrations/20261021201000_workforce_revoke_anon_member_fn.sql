-- Harden Stage 1 membership helper: authenticated only.
revoke all on function public.wf_is_workspace_member(uuid) from public;
revoke all on function public.wf_is_workspace_member(uuid) from anon;
grant execute on function public.wf_is_workspace_member(uuid) to authenticated;
