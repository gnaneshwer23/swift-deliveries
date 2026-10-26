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

The production Neon branch is `br-fancy-breeze-zatt9ocp` in project `spring-wind-48457918`. It has no migration-tracking table. `wf_schema_version()` returned 3 on 26 October 2026.

| Migration                                                          | Production                                  | Preview (`br-lively-water-zavqzat5`) |
| ------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------ |
| Historical `supabase/` workforce and programme migrations (`wf_*`) | Applied before this ledger (tables present) | Inherited                            |
| 0019 `psi_pilot_requests`                                          | Applied before this ledger (table present)  | Inherited                            |
| 0020 supervised missions and spend                                 | Applied 26 Oct 2026 with owner approval     | Applied 25 Oct 2026                  |
| 0021 pilot activations                                             | Applied 26 Oct 2026 with owner approval     | Applied 25 Oct 2026                  |
| 0022 comparison reservations                                       | Applied 26 Oct 2026 with owner approval     | Applied 25 Oct 2026                  |
| 0023 comparison reconciliations                                    | Applied 26 Oct 2026 with owner approval     | Applied 26 Oct 2026                  |
| Row-level security on `psi_pilot_requests`                         | Enabled 26 Oct 2026 with owner approval     | Not applied                          |

Migrations 0020–0023 were applied to production in a single transaction. The six `psi_*` tables are owned by the server role, have no client grants, and have row-level security enabled. No table rows were read during or after the change.

## Rollback for 0020–0023

**Prefer rolling back the code, not the schema.** These migrations only added tables. Application code from before them never reads those tables, so redeploying an earlier build is safe with the tables left in place. Choose this unless a table itself is the problem.

**Only if the schema must be removed:**

1. Get the owner's explicit approval for the specific reason.
2. Take a Neon snapshot of the production branch, or create a branch from it, and record its ID here.
3. Check whether the tables hold data:
   ```sql
   select 'psi_comparison_reconciliations' t, count(*) from psi_comparison_reconciliations
   union all select 'psi_comparison_reservations', count(*) from psi_comparison_reservations
   union all select 'psi_pilot_activations', count(*) from psi_pilot_activations
   union all select 'psi_supervised_spend', count(*) from psi_supervised_spend
   union all select 'psi_supervised_missions', count(*) from psi_supervised_missions;
   ```
   If any count is not zero, stop: those are customer records. Export them under the owner's data-handling instructions before going further, or keep the tables.
4. Deploy application code that no longer reads these tables.
5. Drop the tables in reverse dependency order, in one transaction:
   ```sql
   begin;
   drop table if exists public.psi_comparison_reconciliations;
   drop table if exists public.psi_comparison_reservations;
   drop table if exists public.psi_pilot_activations;
   drop table if exists public.psi_supervised_spend;
   drop table if exists public.psi_supervised_missions;
   commit;
   ```
6. Row-level security on `psi_pilot_requests` needs no rollback. The server role owns the table, so it is unaffected. If it must be reverted, run `alter table public.psi_pilot_requests disable row level security;`.
7. Update the ledger above with the date, the reason and the snapshot ID.

Restoring from the snapshot taken in step 2 reverses steps 4–6. Rehearse the full sequence on a branch before running it on production.
