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

| Migration                                                          | Production                                                                                                                                                                                                               | Preview (`br-lively-water-zavqzat5`) |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| Historical `supabase/` workforce and programme migrations (`wf_*`) | Applied before this ledger (tables present)                                                                                                                                                                              | Inherited                            |
| 0019 `psi_pilot_requests`                                          | Applied before this ledger (table present)                                                                                                                                                                               | Inherited                            |
| 0020 supervised missions and spend                                 | Applied 26 Oct 2026 with owner approval                                                                                                                                                                                  | Applied 25 Oct 2026                  |
| 0021 pilot activations                                             | Applied 26 Oct 2026 with owner approval                                                                                                                                                                                  | Applied 25 Oct 2026                  |
| 0022 comparison reservations                                       | Applied 26 Oct 2026 with owner approval                                                                                                                                                                                  | Applied 25 Oct 2026                  |
| 0023 comparison reconciliations                                    | Applied 26 Oct 2026 with owner approval                                                                                                                                                                                  | Applied 26 Oct 2026                  |
| Row-level security on `psi_pilot_requests`                         | Enabled 26 Oct 2026 with owner approval                                                                                                                                                                                  | Not applied                          |
| 0024 durable missions (`wf_task_runs`, `wf_mission_events`, …)     | Applied 27 Oct 2026 with owner approval                                                                                                                                                                                  | Applied 27 Oct 2026                  |
| 0025 corrections to 0024                                           | Applied 27 Oct 2026 with owner approval                                                                                                                                                                                  | Applied 27 Oct 2026                  |
| 0026 run role and instruction version (`wf_task_runs`)             | Applied 27 Oct 2026 with owner approval                                                                                                                                                                                  | Applied 27 Oct 2026                  |
| 0027 founder evidence (`wf_mission_evidence`)                      | Applied 27 Oct 2026 with owner approval                                                                                                                                                                                  | Applied 27 Oct 2026                  |
| 0028 product memory (`wf_product_memory`) and 0027 constraints     | Applied 27 Oct 2026 with owner approval                                                                                                                                                                                  | Applied 27 Oct 2026                  |
| 0029 conflicting evidence (`wf_memory_conflicts`)                  | Applied 27 Oct 2026 with owner approval                                                                                                                                                                                  | Applied 27 Oct 2026                  |
| 0030 conversations (`wf_conversations`, `wf_conversation_turns`)   | Applied 27 Oct 2026 with owner approval                                                                                                                                                                                  | Applied 27 Oct 2026                  |
| 0031 voice measurements (`wf_voice_metrics`)                       | Not applied — needs owner approval                                                                                                                                                                                       | Applied 27 Oct 2026                  |
| 0032 PSI Stripe activations (`payment_taken`, Stripe ids)          | Applied **28 Oct 2026** with owner approval (`Approve apply 0032 to production Neon br-fancy-breeze-zatt9ocp`); file blob `8f5178636508c0e06df99ec32a7ee70e546b301b` (commit `c7d4bb138f5e98834458d8e204d89210c7a0b236`) | Not applied — needs owner approval   |
| 0033 reconciliation FK `ON DELETE CASCADE`                         | Applied **28 Oct 2026** with owner approval (`ok from me`); file blob `91cab77bb93e85ed5491018c6c398e73a899eeb9` (commit `1caac36a490d5af96b09914f299373f180fc801a`)                                                     | Not applied                          |

Migrations 0020–0023 were applied to production in a single transaction. The six `psi_*` tables are owned by the server role, have no client grants, and have row-level security enabled. No table rows were read during or after the change.

Migrations 0028 and 0029 were applied to production together in a single transaction on 27 October 2026, after a preflight that used only aggregate counts. It found no evidence rows that would break the new 0027 constraints. Production's constraints match the migration files. Preview also carries two redundant single-column foreign keys (`wf_product_memory_first_mission_id_fkey`, `wf_product_memory_last_mission_id_fkey`) left over from an earlier draft of 0028. They clear the same columns on delete as the composite keys, so they change nothing.

Migration 0030 was applied to production on 27 October 2026 in a single transaction, after a catalog-only preflight confirmed neither table existed. A post-apply catalog check on production returned the following.

- **`wf_conversations`:** row-level security on; `has_table_privilege('public', …, 'SELECT')` false; constraints `wf_conversations_pkey`, `wf_conversations_retention_days_check`, `wf_conversations_workspace_id_fkey`.
- **`wf_conversation_turns`:** row-level security on; public SELECT false; constraints `wf_conversation_turns_card_check`, `wf_conversation_turns_check`, `wf_conversation_turns_conversation_id_workspace_id_fkey`, `wf_conversation_turns_input_check`, `wf_conversation_turns_pkey`, `wf_conversation_turns_speaker_check`, `wf_conversation_turns_text_check`.

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

## 0027 founder evidence

Adds `wf_mission_evidence`: notes and text files the founder supplies for a mission, with who supplied them, when, the file's name, type and size, and a SHA-256 of the stored text. Unreadable files are kept as rows with the reason and no content. Removal sets `removed_at`; the row stays as provenance. Server role only, row-level security on. Additive and re-runnable; no existing data is read or changed.

Safe in either order. Code from before 0027 never reads the table. Code after it checks for the table first: until it exists, the mission page says evidence is not available yet, and the worker runs steps without evidence.

Rollback: redeploy the earlier build and leave the table; earlier builds never read it. Only if the table itself must go, with the owner's approval, after the earlier build is live:

1. Take a Neon snapshot of the production branch, or create a branch from it, and record its ID in the ledger.
2. Drop the table only when it is empty. If it holds rows, they are founder records: export them under the owner's data-handling instructions first, or keep the table.

```sql
begin;
-- Blocks every read and write until the transaction ends, so no row can arrive between the check and the drop.
lock table public.wf_mission_evidence in access exclusive mode;
do $$
begin
  if exists (select 1 from public.wf_mission_evidence) then
    raise exception 'wf_mission_evidence holds founder evidence; export it first. Nothing was changed.';
  end if;
  drop table public.wf_mission_evidence;
end $$;
commit;
```

3. Update the ledger with the date, the reason and the snapshot ID.

## 0028 product memory

Adds `wf_product_memory`: what the team has learned about one product (a project) across missions. Each entry keeps the label it was written with (sourced fact, assumption, inference, speculative, requirement, decision or source), its source, where it came from and when it was first and last seen. A partial unique index keeps one current entry per product, kind and statement; retired entries stay as history. The missions an entry was first and last seen in are held to its product by composite keys on `wf_missions (id, project_id)`; deleting a mission clears only that reference (`ON DELETE SET NULL (column)`, Postgres 15+; Neon runs 18). Server role only, row-level security on.

It also tightens 0027, as the review of #42 asked:

- unique `(id, workspace_id)` indexes on `wf_missions` and `wf_projects`;
- a composite foreign key from `wf_mission_evidence (mission_id, workspace_id)`;
- a check that readable evidence carries a content hash.

The app has always written both, so existing rows pass. Additive and re-runnable; no existing data is changed.

Safe in either order. Code from before 0028 never reads the table. Code after it checks for the table first: until it exists, nothing is remembered and the product memory page says so.

Rollback: redeploy the earlier build and leave everything in place; earlier builds ignore the table and the constraints. Only if the table itself must go, with the owner's approval, after the earlier build is live:

1. Take a Neon snapshot of the production branch, or create a branch from it, and record its ID in the ledger.
2. If 0029 is applied, roll it back first (its conflicts reference this table, so the drop below would fail). Then drop the table, only when it is empty. Memory is derived from artefacts, decisions and evidence that stay in their own tables, but it records when each entry was first and last seen, which cannot be rebuilt. Export it under the owner's data-handling instructions first, or keep the table.

```sql
begin;
-- Blocks every read and write until the transaction ends, so no row can arrive between the check and the drop.
lock table public.wf_product_memory in access exclusive mode;
do $$
begin
  if exists (select 1 from public.wf_product_memory) then
    raise exception 'wf_product_memory holds entries; export them first. Nothing was changed.';
  end if;
  drop table public.wf_product_memory;
end $$;
commit;
```

3. The 0027 constraints and the two unique indexes can stay; they only refuse rows that break workspace isolation or provenance. To remove them anyway: `alter table public.wf_mission_evidence drop constraint if exists wf_mission_evidence_mission_workspace_fkey, drop constraint if exists wf_mission_evidence_hash_check;` then `drop index if exists public.wf_missions_id_workspace_uidx, public.wf_projects_id_workspace_uidx, public.wf_missions_id_project_uidx;`. Drop `wf_missions_id_project_uidx` once `wf_product_memory` is gone, since nothing else uses it.
4. Update the ledger with the date, the reason and the snapshot ID.

## 0029 conflicting evidence

Adds `wf_memory_conflicts`: a link between two product-memory entries that the founder has marked as unable to both be true. Neither entry is changed or merged. Resolving a conflict records the founder's reasoning, who resolved it and when, and both entries stay. Each pair is stored in a fixed order and has at most one open conflict; once resolved it can be flagged again, and the resolved rows stay as history. Composite foreign keys hold both entries to the conflict's own product and workspace, backed by a unique `(id, project_id, workspace_id)` index on `wf_product_memory`. Server role only, row-level security on. Additive and re-runnable; no existing data is changed.

Safe in either order. Code from before 0029 never reads the table. Code after it checks for the table first: until it exists, the memory page does not offer conflicts and steps are shown none.

Rollback: redeploy the earlier build and leave the table. Only if it must go, with the owner's approval, after the earlier build is live, take a Neon snapshot and record its ID here, then:

```sql
begin;
lock table public.wf_memory_conflicts in access exclusive mode;
do $$
begin
  if exists (select 1 from public.wf_memory_conflicts) then
    raise exception 'wf_memory_conflicts holds the founder''s conflict decisions; export them first. Nothing was changed.';
  end if;
  drop table public.wf_memory_conflicts;
  drop index if exists public.wf_product_memory_scope_uidx;
end $$;
commit;
```

Update the ledger with the date, the reason and the snapshot ID.

## 0030 conversations

Adds `wf_conversations` and `wf_conversation_turns`: the founder's conversations with the assistant (`docs/conversation.md`). A turn holds text only; there is no column for audio. The assistant's turns carry the card of what it understood, as JSON; a check (`wf_conversation_turns_card_check`) keeps cards off the founder's lines and on every assistant line, and is added by name so a re-run brings an earlier copy of the table up to date. Each conversation has the retention period the founder chose (1, 7, 30 or 90 days), counted from its last turn, and is deleted when that passes. Turns are tied to their conversation's workspace by a composite foreign key and are deleted with it. Server role only, row-level security on. Additive and re-runnable; no existing data is read or changed.

Safe in either order. Code from before 0030 never reads the tables. Code after it checks for them first: until they exist, the conversation panel says conversations are not available yet, and the worker tick deletes nothing.

Rollback: redeploy the earlier build and leave the tables; earlier builds never read them. Only if they must go, with the owner's approval, after the earlier build is live, take a Neon snapshot and record its ID here, then:

```sql
begin;
lock table public.wf_conversations, public.wf_conversation_turns in access exclusive mode;
do $$
begin
  if exists (select 1 from public.wf_conversations) then
    raise exception 'wf_conversations holds founder transcripts; let them expire or have the founder delete them first. Nothing was changed.';
  end if;
  drop table public.wf_conversation_turns;
  drop table public.wf_conversations;
end $$;
commit;
```

Update the ledger with the date, the reason and the snapshot ID.

## 0031 voice measurements

Adds `wf_voice_metrics`: timings and counts for voice (`docs/conversation.md`). It holds no transcript, audio or words:

- for a spoken turn, the time from Send to transcript and from transcript to reply, and whether the founder later corrected the line, with the share of words changed;
- otherwise, one row per interruption, dropped connection, reconnect or failed reconnect.

A turn row links to its conversation line in the same workspace while that line exists. The link is a composite foreign key `(turn_id, workspace_id)` to `wf_conversation_turns (id, workspace_id)`. It uses `ON DELETE SET NULL (turn_id)`, which needs PostgreSQL 15 or later (Neon runs 18). So deleting the conversation clears the link and keeps the numbers. To support the key, the migration adds a unique index on `wf_conversation_turns (id, workspace_id)`. It is additive: `id` is already the primary key, so it can't conflict. An index on `created_at` serves the purge. The worker tick purges rows older than 180 days in batches. Server role only, row-level security on. Additive and re-runnable; no existing data is read or changed. The one `DROP CONSTRAINT` replaces the single-column turn link from an earlier draft of this migration, which only preview carried. It touches no other table.

Safe in either order. Code from before 0031 never reads the table. Code after it checks for the table first: until it exists, nothing is measured and the measurements view says so.

Rollback: redeploy the earlier build and leave the table. Only if it must go, with the owner's approval, after the earlier build is live, take a Neon snapshot and record its ID here, then run the following. It refuses while the table holds measurements, like the 0029 and 0030 rollbacks:

```sql
begin;
lock table public.wf_voice_metrics in access exclusive mode;
do $$
begin
  if exists (select 1 from public.wf_voice_metrics) then
    raise exception 'wf_voice_metrics holds measurements; export them or have the owner accept losing them (the snapshot is then the only copy). Nothing was changed.';
  end if;
  drop table public.wf_voice_metrics;
end $$;
drop index if exists public.wf_conversation_turns_id_workspace_uidx;
commit;
```

If the owner accepts losing the measurements, empty the table first with `delete from public.wf_voice_metrics;` in the same transaction. Record that acceptance here. The snapshot is then the only copy. Update the ledger with the date, the reason and the snapshot ID.

## 0032 PSI Stripe activations

Allows `payment_taken = true` on `psi_pilot_activations`, makes `request_id` nullable for self-serve Checkout without a prior enquiry, and adds Stripe identity columns (`stripe_checkout_session_id`, customer/subscription ids, lookup key, `payment_environment`) with a unique partial index on the Checkout Session id for webhook idempotency. Additive and re-runnable. Does **not** change legacy Supabase `subscriptions`. Production apply requires owner approval after sandbox proof (P1-3).

**Order.** Apply before deploying code that inserts `payment_taken = true`. Code that only reads activations and ignores unknown columns remains safe; code that still assumes `payment_taken = false` must be updated first (this tip does).

**Production apply (28 Oct 2026).** Owner approved with the exact sentence for `br-fancy-breeze-zatt9ocp` (project `spring-wind-48457918`). Applied via Production `DATABASE_URL_UNPOOLED` after confirming `neon.branch_id = br-fancy-breeze-zatt9ocp`. Catalog-only preflight showed the `payment_taken = false` check and no Stripe columns; post-apply verify: check dropped, `request_id` nullable, Stripe columns + session unique index + subscription index present, `payment_environment` check allows `sandbox`/`live`. No customer rows were read. Preview branch was **not** in the approval sentence and was not updated.

**Rollback.** Prefer redeploying code that stops writing Stripe columns. To reverse schema only with owner approval, after a Neon snapshot: drop the new indexes/columns and restore a `payment_taken = false` check **only if no row has `payment_taken = true`**. If any paid row exists, do not re-impose the false-only check.

## 0033 reconciliation FK cascade

Replaces the default `NO ACTION` foreign key from `psi_comparison_reconciliations` to `psi_comparison_reservations` with `ON DELETE CASCADE`, so deleting a reservation or mission does not leave undeletable reconciliation orphans.

**Production apply (28 Oct 2026).** Owner approved with `ok from me` for production Neon `br-fancy-breeze-zatt9ocp` (project `spring-wind-48457918`). Applied via `DATABASE_URL_UNPOOLED` from local `.env.local` after confirming `neon.branch_id = br-fancy-breeze-zatt9ocp`. Catalog-only preflight: FK existed without `ON DELETE CASCADE`. Post-apply verify: `confdeltype = c` (`CASCADE`), constraint def includes `ON DELETE CASCADE`. No table rows were read. Preview branch was not updated.

**Rollback.** With owner approval after a Neon snapshot, drop and re-add the foreign key without `ON DELETE CASCADE` only if no automated cascade deletes have been relied on in production.
