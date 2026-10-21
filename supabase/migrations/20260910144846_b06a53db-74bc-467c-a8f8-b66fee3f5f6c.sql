CREATE TABLE public.self_report_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_kind text NOT NULL CHECK (claim_kind IN ('identity','target','strength','evidence_posture','working_style')),
  claim_key text NOT NULL,
  claim_value text NOT NULL,
  framework_capability_key text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, claim_kind, claim_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.self_report_claims TO authenticated;
GRANT ALL ON public.self_report_claims TO service_role;
ALTER TABLE public.self_report_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own self-report claims"
  ON public.self_report_claims FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert own self-report claims"
  ON public.self_report_claims FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own self-report claims"
  ON public.self_report_claims FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete own self-report claims"
  ON public.self_report_claims FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE INDEX self_report_claims_owner_kind_idx ON public.self_report_claims (owner_id, claim_kind);

CREATE TRIGGER update_self_report_claims_updated_at
  BEFORE UPDATE ON public.self_report_claims
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TABLE public.pi_onboarding_state (
  owner_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 8),
  completed boolean NOT NULL DEFAULT false,
  skipped_steps integer[] NOT NULL DEFAULT '{}',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pi_onboarding_state TO authenticated;
GRANT ALL ON public.pi_onboarding_state TO service_role;
ALTER TABLE public.pi_onboarding_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own onboarding state"
  ON public.pi_onboarding_state FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert own onboarding state"
  ON public.pi_onboarding_state FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own onboarding state"
  ON public.pi_onboarding_state FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete own onboarding state"
  ON public.pi_onboarding_state FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE TRIGGER update_pi_onboarding_state_updated_at
  BEFORE UPDATE ON public.pi_onboarding_state
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();