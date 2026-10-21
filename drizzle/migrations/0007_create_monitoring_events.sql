CREATE TABLE public.monitoring_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL CHECK (kind IN ('uptime_check','journey_error','client_error','server_error','payment_failure')),
  severity text NOT NULL CHECK (severity IN ('info','warning','error','critical')),
  environment text NOT NULL DEFAULT 'production',
  source text NOT NULL,
  route text,
  message text NOT NULL,
  fingerprint text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX monitoring_events_occurred_at_idx ON public.monitoring_events (occurred_at DESC);
CREATE INDEX monitoring_events_kind_idx ON public.monitoring_events (kind, occurred_at DESC);

GRANT SELECT ON public.monitoring_events TO authenticated;
GRANT ALL ON public.monitoring_events TO service_role;

ALTER TABLE public.monitoring_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read monitoring events"
ON public.monitoring_events
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER monitoring_events_append_only
BEFORE UPDATE OR DELETE ON public.monitoring_events
FOR EACH ROW EXECUTE FUNCTION private.forbid_mutation();