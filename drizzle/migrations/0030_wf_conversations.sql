-- Phase 4a: conversations with the assistant, typed or spoken (docs/migrations-and-rollback.md).
-- Additive and re-runnable. Only text is stored: there is no column for audio,
-- so raw audio can never be kept. Each conversation is kept for the period the
-- founder chose, counted from its last turn, then deleted; the founder can
-- delete it sooner.
CREATE TABLE IF NOT EXISTS public.wf_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.wf_workspaces (id) ON DELETE CASCADE,
  user_id text NOT NULL,
  retention_days integer NOT NULL CHECK (retention_days IN (1, 7, 30, 90)),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_turn_at timestamptz NOT NULL DEFAULT now(),
  retain_until timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS wf_conversations_id_workspace_uidx
  ON public.wf_conversations (id, workspace_id);
CREATE INDEX IF NOT EXISTS wf_conversations_user_idx
  ON public.wf_conversations (workspace_id, user_id, last_turn_at DESC);
CREATE INDEX IF NOT EXISTS wf_conversations_retain_idx
  ON public.wf_conversations (retain_until);

-- One line of a conversation. The founder's lines record how they arrived
-- (typed, speech, or a correction of an earlier line); the assistant's lines
-- carry the card of what it understood. A card never acts by itself.
CREATE TABLE IF NOT EXISTS public.wf_conversation_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Order of writing: a founder line and its reply share a transaction, and so a timestamp.
  seq bigint GENERATED ALWAYS AS IDENTITY,
  conversation_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  speaker text NOT NULL CHECK (speaker IN ('founder', 'assistant')),
  input text NOT NULL CHECK (input IN ('typed', 'speech', 'edited', 'assistant')),
  text text NOT NULL CHECK (length(text) BETWEEN 1 AND 4000),
  card jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((speaker = 'assistant') = (input = 'assistant')),
  FOREIGN KEY (conversation_id, workspace_id)
    REFERENCES public.wf_conversations (id, workspace_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS wf_conversation_turns_conversation_idx
  ON public.wf_conversation_turns (conversation_id, seq);
-- Founder lines never carry a card; assistant lines always do. Added by name so a
-- re-run also brings an earlier copy of this table up to date.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'wf_conversation_turns_card_check'
       AND conrelid = 'public.wf_conversation_turns'::regclass
  ) THEN
    ALTER TABLE public.wf_conversation_turns
      ADD CONSTRAINT wf_conversation_turns_card_check
      CHECK ((speaker = 'assistant') = (card IS NOT NULL));
  END IF;
END $$;

-- Server role only: no client grants, row-level security on.
REVOKE ALL ON public.wf_conversations FROM PUBLIC;
REVOKE ALL ON public.wf_conversation_turns FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON public.wf_conversations FROM anon';
    EXECUTE 'REVOKE ALL ON public.wf_conversation_turns FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON public.wf_conversations FROM authenticated';
    EXECUTE 'REVOKE ALL ON public.wf_conversation_turns FROM authenticated';
  END IF;
END $$;
ALTER TABLE public.wf_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wf_conversation_turns ENABLE ROW LEVEL SECURITY;
