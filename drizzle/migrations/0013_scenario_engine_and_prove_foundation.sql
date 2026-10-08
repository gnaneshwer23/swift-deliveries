-- Scenario engine: extend experience_scenarios with authoring-template fields
ALTER TABLE public.experience_scenarios
  ADD COLUMN sector text,
  ADD COLUMN entry_level text,
  ADD COLUMN signature_dilemma text,
  ADD COLUMN framework_version text NOT NULL DEFAULT 'pm-core@2026.1';

-- Stakeholders per scenario (every stakeholder must be right about something)
CREATE TABLE public.scenario_stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.experience_scenarios(id),
  name text NOT NULL,
  wants text NOT NULL,
  starting_trust text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.scenario_stakeholders TO authenticated;
GRANT ALL ON public.scenario_stakeholders TO service_role;
ALTER TABLE public.scenario_stakeholders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read scenario stakeholders"
  ON public.scenario_stakeholders FOR SELECT TO authenticated USING (true);

-- Phases per scenario: each phase produces exactly one artefact mapped to rubric dimensions
CREATE TABLE public.scenario_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.experience_scenarios(id),
  phase_number integer NOT NULL,
  title text NOT NULL,
  brief text NOT NULL,
  artefact_type text NOT NULL,
  rubric_dimensions text[] NOT NULL DEFAULT '{}',
  unlock_after integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.scenario_phases TO authenticated;
GRANT ALL ON public.scenario_phases TO service_role;
ALTER TABLE public.scenario_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read scenario phases"
  ON public.scenario_phases FOR SELECT TO authenticated USING (true);

-- Event card library (shared across organisations)
CREATE TABLE public.event_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  trigger_description text NOT NULL,
  tests text NOT NULL,
  required_artefact text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_cards TO authenticated;
GRANT ALL ON public.event_cards TO service_role;
ALTER TABLE public.event_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read event cards"
  ON public.event_cards FOR SELECT TO authenticated USING (true);

-- Which event cards an organisation can draw
CREATE TABLE public.scenario_event_cards (
  scenario_id uuid NOT NULL REFERENCES public.experience_scenarios(id),
  event_card_id uuid NOT NULL REFERENCES public.event_cards(id),
  PRIMARY KEY (scenario_id, event_card_id)
);
GRANT SELECT ON public.scenario_event_cards TO authenticated;
GRANT ALL ON public.scenario_event_cards TO service_role;
ALTER TABLE public.scenario_event_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read scenario event cards"
  ON public.scenario_event_cards FOR SELECT TO authenticated USING (true);

-- Event cards drawn by a candidate during an enrolment (owner-scoped)
CREATE TABLE public.user_event_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  enrolment_id uuid NOT NULL REFERENCES public.experience_enrolments(id),
  event_card_id uuid NOT NULL REFERENCES public.event_cards(id),
  drawn_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'open'
);
GRANT SELECT, INSERT, UPDATE ON public.user_event_draws TO authenticated;
GRANT ALL ON public.user_event_draws TO service_role;
ALTER TABLE public.user_event_draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their event draws"
  ON public.user_event_draws FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert their event draws"
  ON public.user_event_draws FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update their event draws"
  ON public.user_event_draws FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

-- Prove: attestation upgrade (per-artefact, fixed statements, level, renewal)
ALTER TABLE public.attestations
  ADD COLUMN artefact_version_id uuid REFERENCES public.artefact_versions(id),
  ADD COLUMN statement_key text,
  ADD COLUMN attestation_level text,
  ADD COLUMN renewal_due_at timestamptz;

-- Prove: Open Badges 3.0 credentials issued on signed attestations
CREATE TABLE public.credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attestation_id uuid NOT NULL REFERENCES public.attestations(id),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  credential_json jsonb NOT NULL,
  status text NOT NULL DEFAULT 'active',
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);
GRANT SELECT ON public.credentials TO authenticated;
GRANT ALL ON public.credentials TO service_role;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their credentials"
  ON public.credentials FOR SELECT TO authenticated USING (auth.uid() = owner_id);