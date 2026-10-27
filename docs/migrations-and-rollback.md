# Database migrations and rollback

27 October 2026. Phase 0 of the PSI voice build plan.

## Where migrations live

New migrations go in **`drizzle/migrations/` only**, as `NNNN_short_name.sql` with the next number (0024 onward).

`supabase/migrations/` and `db/neon/` are historical. They describe how earlier tables were created and must not be edited or extended. The drizzle journal (`drizzle/migrations/meta/_journal.json`) stops at 0018. Migrations 0019 onward are hand-written SQL applied directly, so the ledger below is the record of what each environment has.

Every new migration must be:

- **Additive.** It creates tables, columns or indexes. It never drops, renames or rewrites existing data, and it never touches legacy Delivery-OS `projects`, `tasks` or `artefacts`.
- **Re-runnable.** It uses `IF NOT EXISTS` and guarded `DO` blocks, so applying it twice is harmless.
- **Locked down.** New tables revoke client grants and enable row-level security. The server role remains the only reader and writer.
- **Paired with a rollback section** in this document before it reaches production.
- **Applied in order**: an isolated Neon branch or local `deliverx_phase1_*` database, then preview, then production. Production needs the owner's explicit approval each time.

## Ledger

The production Neon branch is `br-fancy-breeze-zatt9ocp` in project `spring-wind-48457918`. It has no migration-tracking table. `wf_schema_version()` returned 3 on 26 October 2026 and 4 after 0024 on 27 October 2026.

| Migration                                                          | Production                                  | Preview (`br-lively-water-zavqzat5`) |
| ------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------ |
| Historical `supabase/` workforce and programme migrations (`wf_*`) | Applied before this ledger (tables present) | Inherited                            |
| 0019 `psi_pilot_requests`                                          | Applied before this ledger (table present)  | Inherited                            |
| 0020 supervised missions and spend                                 | Applied 26 Oct 2026 with owner approval     | Applied 25 Oct 2026                  |
| 0021 pilot activations                                             | Applied 26 Oct 2026 with owner approval     | Applied 25 Oct 2026                  |
| 0022 comparison reservations                                       | Applied 26 Oct 2026 with owner approval     | Applied 25 Oct 2026                  |
| 0023 comparison reconciliations                                    | Applied 26 Oct 2026 with owner approval     | Applied 26 Oct 2026                  |
| Row-level security on `psi_pilot_requests`                         | Enabled 26 Oct 2026 with owner approval     | Not applied                          |
| 0024 durable missions (`wf_task_runs`, `wf_mission_events`, …)     | Applied 27 Oct 2026 with owner approval     | Applied 27 Oct 2026                  |
| 0025 corrections to 0024                                           | Applied 27 Oct 2026 with owner approval     | Applied 27 Oct 2026                  |
| 0026 run role and instruction version (`wf_task_runs`)             | Not applied — needs owner approval          | Pending                              |

Migrations 0020–0023 were applied to production in a single transaction. The six `psi_*` tables are owned by the server role, have no client grants, and have row-level security enabled. No table rows were read during or after the change.

## Rollback for 0020–0023

**Prefer rolling back the code, not the schema.** These migrations only added tables. Application code from before them never reads those tables, so redeploying an earlier build is safe with the tables left in place. Choose this unless a table itself is the problem.

**Only if the schema must be removed:**

1. Get the owner's explicit approval for the specific reason.
2. Take a Neon snapshot of the production branch, or create a branch from it, and record its ID here.
3. Deploy application code that no longer reads or writes these tables, and confirm the deployment is live. This stops new writes before anything is checked.
4. Check whether the tables hold data:
   ```sql
   select 'psi_comparison_reconciliations' t, count(*) from public.psi_comparison_reconciliations
   union all select 'psi_comparison_reservations', count(*) from public.psi_comparison_reservations
   union all select 'psi_pilot_activations', count(*) from public.psi_pilot_activations
   union all select 'psi_supervised_spend', count(*) from public.psi_supervised_spend
   union all select 'psi_supervised_missions', count(*) from public.psi_supervised_missions;
   ```
   If any count is not zero, stop: those are customer records. Export them under the owner's data-handling instructions before going further, or keep the tables.
5. Drop the tables in reverse dependency order, in one transaction. The transaction locks every table and checks again that each is empty, so a write that arrived after step 4 aborts the drop instead of being lost:
   ```sql
   begin;
   lock table public.psi_comparison_reconciliations, public.psi_comparison_reservations,
     public.psi_pilot_activations, public.psi_supervised_spend, public.psi_supervised_missions
     in access exclusive mode;
   do $$ begin
     if exists (select 1 from public.psi_comparison_reconciliations)
       or exists (select 1 from public.psi_comparison_reservations)
       or exists (select 1 from public.psi_pilot_activations)
       or exists (select 1 from public.psi_supervised_spend)
       or exists (select 1 from public.psi_supervised_missions) then
       raise exception 'A table is not empty; nothing was dropped.';
     end if;
   end $$;
   drop table public.psi_comparison_reconciliations;
   drop table public.psi_comparison_reservations;
   drop table public.psi_pilot_activations;
   drop table public.psi_supervised_spend;
   drop table public.psi_supervised_missions;
   commit;
   ```
6. Row-level security on `psi_pilot_requests` needs no rollback. The server role owns the table, so it is unaffected. If it must be reverted, run `alter table public.psi_pilot_requests disable row level security;`.
7. Update the ledger above with the date, the reason and the snapshot ID.

Restoring the snapshot from step 2 reverses only the database changes (steps 5–6). To undo step 3, redeploy the application version you want separately. The step 5 SQL was rehearsed on 27 October 2026 against a local test database built from these migrations: with one row present it aborted and dropped nothing; with the tables empty it dropped all five and left `psi_pilot_requests`. Rehearse the full sequence on a Neon branch before running it on production.

## 0024 durable missions

**Order.** Apply 0024 before deploying code that uses it: the Phase 1a mission handlers write the new columns and tables. Code from before 0024 keeps working with 0024 applied, because every new column has a default or is nullable, and the status check only gains `paused`.

**Re-runnable.** Every statement is `IF NOT EXISTS` or drop-and-recreate. The unique index on `wf_workspaces.owner_id` is created only when no owner has two workspaces; if it is skipped, the advisory lock in `ensureWorkspace` still prevents new duplicates. Check afterwards with `select wf_schema_version();` (expect 4) and `select indexname from pg_indexes where indexname = 'wf_workspaces_owner_id_unique';`.

**Rollback.** Prefer redeploying the earlier build and leaving the schema in place. Earlier builds do not know the `paused` status, so resume or cancel any paused mission first:

```sql
select count(*) from public.wf_missions where status = 'paused';
```

Only if the schema itself must be removed, with the owner's approval and a snapshot taken first, after the earlier build is live:

```sql
begin;
lock table public.wf_missions, public.wf_mission_events, public.wf_task_runs in access exclusive mode;
do $$ begin
  if exists (select 1 from public.wf_missions where status = 'paused') then
    raise exception 'Paused missions exist; nothing was changed.';
  end if;
  if exists (select 1 from public.wf_task_runs) or exists (select 1 from public.wf_mission_events) then
    raise exception 'The run ledger or event log holds records; export them first. Nothing was changed.';
  end if;
end $$;
drop table public.wf_task_runs;
drop table public.wf_mission_events;
drop function public.wf_mission_events_append_only();
alter table public.wf_missions drop constraint wf_missions_status_check;
alter table public.wf_missions add constraint wf_missions_status_check check (status in (
  'draft', 'needs_clarification', 'planned', 'awaiting_approval', 'queued', 'running',
  'reviewing', 'completed', 'partially_completed', 'blocked', 'failed', 'cancelled'));
create or replace function public.wf_schema_version() returns integer language sql immutable as $f$ select 3 $f$;
commit;
```

The rollback SQL was rehearsed on 27 October 2026 against a local database built from the test schema and 0024: it dropped the two tables and returned the schema version to 3, and 0024 then re-applied cleanly. 0024 was applied in one transaction to the preview branch and then, with the owner's approval, to production on 27 October 2026. On both, the owner index was created, row-level security is on for the two new tables, the status check includes `paused`, and `wf_schema_version()` returns 4. No customer records were inspected; the only data the migration reads is its own duplicate-owner count before creating the owner index.

The added columns and the owner index are left in place: dropping them would discard plan versions, approval bindings and the stop flag, and earlier builds ignore them. The event log and run ledger are dropped only when both are empty; earlier builds never read them. If either holds records, export them under the owner's data-handling instructions first, or keep the tables.

## 0025 corrections to 0024

0025 changes no data. It lets deleting a mission or workspace cascade to its events, which 0024's append-only trigger blocked, while direct updates and deletes stay refused. It also drops the owner index 0024 added where an older unique index (`wf_workspaces_owner_uidx` in Neon) already covers `owner_id`. Applied to preview and then production on 27 October 2026; production now has one owner index (`wf_workspaces_owner_uidx`). Re-running 0024 brings both back, so always run 0025 after it. Neither change is read by the application, so redeploying an earlier build needs no schema change. To reverse 0025 itself, with the owner's approval and a snapshot taken first:

```sql
begin;
create or replace function public.wf_mission_events_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'wf_mission_events is append-only';
end $$;
create unique index if not exists wf_workspaces_owner_id_unique on public.wf_workspaces (owner_id);
commit;
```

This blocks deleting any mission or workspace that has events again, so only do it if the cascade itself is the problem.

## 0026 run role and instruction version

Adds `role_id`, `instruction_version` and `model_calls` to `wf_task_runs`, so each run records which role and instruction version produced it and how many model calls it made. Additive and re-runnable; no data is read or changed. Apply before deploying the code that writes these columns: the worker's commit step writes them, and a missing column would make every step fail. Code from before 0026 ignores the columns.

Rollback: redeploy the earlier build and leave the columns; they are nullable or defaulted. Only if they must go, with the owner's approval: `alter table public.wf_task_runs drop column if exists role_id, drop column if exists instruction_version, drop column if exists model_calls;` (this discards those recorded values).
