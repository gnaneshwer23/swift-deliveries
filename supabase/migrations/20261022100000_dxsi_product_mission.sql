-- DXSI product missions (docs/dxsi-implementation-plan.md).
-- Additive and non-destructive: widens two CHECK constraints and adds a
-- schema-version probe. Existing rows are untouched.
--
-- DEPLOY ORDER: safe in either order. The app probes wf_schema_version() and
-- only offers "Build a product" missions once this migration is applied.

-- 1. Allow the end-to-end product mission intent.
alter table public.wf_missions drop constraint if exists wf_missions_intent_check;
alter table public.wf_missions
  add constraint wf_missions_intent_check
  check (intent in ('investigate', 'prototype', 'improve', 'build'));

-- 2. Allow lifecycle stage artefact kinds.
alter table public.wf_artefacts drop constraint if exists wf_artefacts_kind_check;
alter table public.wf_artefacts
  add constraint wf_artefacts_kind_check
  check (kind in (
    'brief',
    'prototype_html',
    'improvement_memo',
    'delivery_report',
    'note',
    'mission_charter',
    'research_dossier',
    'tech_radar',
    'prd',
    'design_spec',
    'architecture',
    'test_report',
    'release_pack',
    'evolution_plan'
  ));

-- 3. Schema version probe (service role only).
create or replace function public.wf_schema_version()
returns integer
language sql
immutable
set search_path = public
as $$ select 2 $$;

revoke all on function public.wf_schema_version() from public;
revoke all on function public.wf_schema_version() from anon;
revoke all on function public.wf_schema_version() from authenticated;
grant execute on function public.wf_schema_version() to service_role;
