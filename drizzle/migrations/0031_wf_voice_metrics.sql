-- Phase 4c: voice measurements (docs/migrations-and-rollback.md).
-- Additive and re-runnable. Timings and counts only: no transcript, no audio,
-- no words. A turn row can be linked to its conversation line while that line
-- exists; the link is cleared when the conversation is deleted, and the
-- measurement stays. The worker tick purges rows older than 180 days in batches.
CREATE TABLE IF NOT EXISTS public.wf_voice_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('turn', 'interruption', 'drop', 'reconnect', 'reconnect_failed')),
  turn_id uuid,
  transcript_ms integer CHECK (transcript_ms IS NULL OR transcript_ms BETWEEN 0 AND 600000),
  reply_ms integer CHECK (reply_ms IS NULL OR reply_ms BETWEEN 0 AND 600000),
  corrected boolean NOT NULL DEFAULT false,
  word_change real CHECK (word_change IS NULL OR word_change BETWEEN 0 AND 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (kind = 'turn' OR (transcript_ms IS NULL AND reply_ms IS NULL AND NOT corrected)),
  CHECK (word_change IS NULL OR corrected)
);
CREATE INDEX IF NOT EXISTS wf_voice_metrics_workspace_idx
  ON public.wf_voice_metrics (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wf_voice_metrics_created_idx
  ON public.wf_voice_metrics (created_at);
CREATE UNIQUE INDEX IF NOT EXISTS wf_voice_metrics_turn_uidx
  ON public.wf_voice_metrics (turn_id) WHERE turn_id IS NOT NULL;

-- A measurement's turn must be in the measurement's own workspace. Deleting the
-- turn clears only the link (PostgreSQL 15+ column list on SET NULL).
CREATE UNIQUE INDEX IF NOT EXISTS wf_conversation_turns_id_workspace_uidx
  ON public.wf_conversation_turns (id, workspace_id);
DO $$
BEGIN
  -- An earlier draft of this migration linked turn_id alone; replace that link.
  IF EXISTS (SELECT 1 FROM pg_constraint
              WHERE conname = 'wf_voice_metrics_turn_id_fkey'
                AND conrelid = 'public.wf_voice_metrics'::regclass) THEN
    ALTER TABLE public.wf_voice_metrics DROP CONSTRAINT wf_voice_metrics_turn_id_fkey;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'wf_voice_metrics_turn_workspace_fkey'
                    AND conrelid = 'public.wf_voice_metrics'::regclass) THEN
    ALTER TABLE public.wf_voice_metrics
      ADD CONSTRAINT wf_voice_metrics_turn_workspace_fkey
      FOREIGN KEY (turn_id, workspace_id)
      REFERENCES public.wf_conversation_turns (id, workspace_id)
      ON DELETE SET NULL (turn_id);
  END IF;
END $$;

-- Server role only: no client grants, row-level security on.
REVOKE ALL ON public.wf_voice_metrics FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.wf_voice_metrics FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.wf_voice_metrics FROM authenticated';
  END IF;
END $$;
ALTER TABLE public.wf_voice_metrics ENABLE ROW LEVEL SECURITY;
