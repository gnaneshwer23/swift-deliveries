-- Corrections to 0024 (docs/migrations-and-rollback.md). Re-runnable.

-- The event log stays append-only for direct writes, but deleting a mission or
-- workspace may cascade to its events. A cascade runs inside the foreign-key
-- trigger, so it arrives here at trigger depth 2 or more.
CREATE OR REPLACE FUNCTION public.wf_mission_events_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'wf_mission_events is append-only';
END $$;

-- 0024 added an owner index even where one already existed. Keep a single
-- unique index on owner_id: drop 0024's when another one covers the column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_index i
      JOIN pg_class c ON c.oid = i.indexrelid
     WHERE i.indrelid = 'public.wf_workspaces'::regclass
       AND i.indisunique
       AND c.relname <> 'wf_workspaces_owner_id_unique'
       AND i.indnatts = 1
       AND i.indkey[0] = (SELECT attnum FROM pg_attribute
                           WHERE attrelid = 'public.wf_workspaces'::regclass AND attname = 'owner_id')
  ) THEN
    DROP INDEX IF EXISTS public.wf_workspaces_owner_id_unique;
  END IF;
END $$;
