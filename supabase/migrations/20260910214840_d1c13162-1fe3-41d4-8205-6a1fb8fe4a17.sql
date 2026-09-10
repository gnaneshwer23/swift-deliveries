CREATE TABLE public.experience_scenarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  framework_id uuid NOT NULL REFERENCES public.capability_frameworks(id),
  name text NOT NULL,
  summary text NOT NULL,
  company_name text NOT NULL,
  company_stage text NOT NULL,
  company_mark text NOT NULL,
  role_title text NOT NULL,
  duration_label text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.experience_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id uuid NOT NULL REFERENCES public.experience_scenarios(id) ON DELETE CASCADE,
  key text NOT NULL,
  week integer NOT NULL,
  sort_order integer NOT NULL,
  title text NOT NULL,
  phase_label text NOT NULL,
  brief text NOT NULL,
  context text NOT NULL,
  stakeholders jsonb NOT NULL DEFAULT '[]'::jsonb,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  guidance jsonb NOT NULL DEFAULT '[]'::jsonb,
  capability_key text NOT NULL,
  min_words integer NOT NULL DEFAULT 120,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scenario_id, key)
);

CREATE TABLE public.experience_enrolments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES public.experience_scenarios(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','completed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (owner_id, scenario_id)
);

CREATE TABLE public.experience_task_drafts (
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.experience_tasks(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, task_id)
);

CREATE TABLE public.experience_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolment_id uuid NOT NULL REFERENCES public.experience_enrolments(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.experience_tasks(id) ON DELETE CASCADE,
  artefact_version_id uuid NOT NULL REFERENCES public.artefact_versions(id),
  word_count integer NOT NULL,
  sections_completed integer NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, task_id)
);

GRANT SELECT ON public.experience_scenarios TO authenticated;
GRANT ALL ON public.experience_scenarios TO service_role;
GRANT SELECT ON public.experience_tasks TO authenticated;
GRANT ALL ON public.experience_tasks TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.experience_enrolments TO authenticated;
GRANT ALL ON public.experience_enrolments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experience_task_drafts TO authenticated;
GRANT ALL ON public.experience_task_drafts TO service_role;
GRANT SELECT, INSERT ON public.experience_submissions TO authenticated;
GRANT ALL ON public.experience_submissions TO service_role;

ALTER TABLE public.experience_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_enrolments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_task_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in people can read available scenarios"
  ON public.experience_scenarios FOR SELECT TO authenticated USING (enabled);

CREATE POLICY "Signed-in people can read tasks of available scenarios"
  ON public.experience_tasks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.experience_scenarios s WHERE s.id = scenario_id AND s.enabled));

CREATE POLICY "People read their own enrolments"
  ON public.experience_enrolments FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "People join scenarios themselves"
  ON public.experience_enrolments FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "People update their own enrolments"
  ON public.experience_enrolments FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "People manage their own drafts"
  ON public.experience_task_drafts FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "People read their own submissions"
  ON public.experience_submissions FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "People create their own submissions"
  ON public.experience_submissions FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

INSERT INTO public.experience_scenarios (key, framework_id, name, summary, company_name, company_stage, company_mark, role_title, duration_label, enabled)
SELECT 'mediflow-q3-discovery', f.id,
  'MediFlow Q3 Discovery',
  'Four weeks as an Associate Product Manager at a Series B clinical AI company choosing its Q3 direction. Every task you submit is locked and becomes evidence.',
  'MediFlow Technologies', 'Clinical AI · Series B', 'MT', 'Associate Product Manager', 'Week 1 of 4', true
FROM public.capability_frameworks f WHERE f.key = 'pm-core' AND f.version = '2026.1';

INSERT INTO public.experience_tasks (scenario_id, key, week, sort_order, title, phase_label, brief, context, stakeholders, sections, guidance, capability_key, min_words)
SELECT s.id, t.key, t.week, t.sort_order, t.title, t.phase_label, t.brief, t.context, t.stakeholders, t.sections, t.guidance, t.capability_key, t.min_words
FROM public.experience_scenarios s
CROSS JOIN (VALUES
  ('discovery-brief', 1, 1, 'Write the discovery brief', 'Week 1 · Task 1 of 5',
   'MediFlow''s clinical AI platform has three possible Q3 directions but no clear framing of the core problem. Structure the discovery brief that will orient the team for the next eight weeks. Sarah Chen wants it by end of day.',
   'MediFlow has been in market for 18 months with a clinical documentation tool used by 47 NHS trusts. The board wants a Q3 direction addressing one of three opportunities: (a) deeper integration with EPR systems, (b) a patient-facing summary tool, or (c) a clinical trial recruitment screening module. James Wilson''s sales team is pushing hard for (c) because two pharma clients have asked. Sarah Chen is sceptical — she thinks NHS trusts will not adopt a sales-driven pivot without evidence of clinical need.',
   '[{"initials":"SC","name":"Sarah Chen","role":"CEO · Requesting stakeholder","trust":"high"},{"initials":"JW","name":"James Wilson","role":"Sales · Competing priorities","trust":"low"},{"initials":"RK","name":"Raj Kumar","role":"Engineering Lead","trust":"neutral"}]'::jsonb,
   '["Problem statement — what is the core problem we are trying to solve?","Evidence of need — what signals suggest this is worth investigating?","Who is affected — who are the users and what are they trying to do?","Scope decision — which direction are you recommending and why not the others?","Next steps — what does the team need to do in weeks 1–2 to validate this?"]'::jsonb,
   '[{"dimension":"Problem framing","hint":"Is the problem clearly named, distinct from a solution, and relevant to the stakeholder?"},{"dimension":"Evidence of need","hint":"What data, signals, or user behaviour supports investigating this direction?"},{"dimension":"User clarity","hint":"Who specifically is affected? Clinician, patient, admin? What are they trying to do?"},{"dimension":"Scope discipline","hint":"A good brief argues for one direction by ruling out others with reasons, not just picking a favourite."}]'::jsonb,
   'discovery', 120),
  ('stakeholder-map', 1, 2, 'Map the stakeholders and the tension', 'Week 1 · Task 2 of 5',
   'Sarah and James want different things and Raj is worried about delivery capacity. Write the stakeholder map you would use to run the next four weeks without the direction being reopened every Monday.',
   'James has already told two pharma clients that screening is "on the roadmap". Raj has one team of six engineers and an EPR integration backlog. Sarah has asked you privately whether the sales commitment is a problem. Clinical Safety Officer Priya Raman must sign off anything patient-facing.',
   '[{"initials":"SC","name":"Sarah Chen","role":"CEO · Decision owner","trust":"high"},{"initials":"JW","name":"James Wilson","role":"Sales · External commitments","trust":"low"},{"initials":"PR","name":"Priya Raman","role":"Clinical Safety Officer","trust":"neutral"}]'::jsonb,
   '["Who decides, who advises, who is informed","What each stakeholder actually needs, not what they asked for","Where the real conflict sits and what it costs","How you will handle the existing sales commitment","The cadence and forum for direction decisions"]'::jsonb,
   '[{"dimension":"Influence clarity","hint":"Separate decision rights from opinions. Who can say no?"},{"dimension":"Motivation","hint":"Name the underlying need behind each stated request."},{"dimension":"Conflict handling","hint":"Do not smooth over the sales commitment — say how it is managed."},{"dimension":"Working agreement","hint":"A map is only useful if it changes how the next four weeks run."}]'::jsonb,
   'stakeholders', 120),
  ('prioritisation-decision', 1, 3, 'Make the prioritisation call', 'Week 1 · Task 3 of 5',
   'Discovery is done. Choose one Q3 direction, show the trade-off honestly, and state what you are explicitly not doing.',
   'Research found: 31 of 47 trusts named EPR double-entry as their top complaint; the patient summary tool tested well with patients but has no buyer; screening has two interested pharma clients worth £180k combined but no NHS pull and needs clinical safety review. Engineering capacity allows one substantial initiative in Q3.',
   '[{"initials":"SC","name":"Sarah Chen","role":"CEO · Decision owner","trust":"high"},{"initials":"RK","name":"Raj Kumar","role":"Engineering Lead · Capacity","trust":"neutral"}]'::jsonb,
   '["The decision, stated in one sentence","The criteria you judged against","The trade-off you are accepting","What you are not doing this quarter and why","How you will know within six weeks if this was wrong"]'::jsonb,
   '[{"dimension":"Explicit criteria","hint":"Name the criteria before the answer, not after."},{"dimension":"Trade-off honesty","hint":"Every real decision loses something. Say what."},{"dimension":"Evidence use","hint":"Tie the call back to the discovery signals, including the inconvenient ones."},{"dimension":"Falsifiability","hint":"State the signal that would tell you this was the wrong call."}]'::jsonb,
   'prioritisation', 120),
  ('requirements-doc', 2, 4, 'Write the product requirements', 'Week 2 · Task 4 of 5',
   'Turn the chosen direction into requirements Raj''s team can build against and Priya can review for clinical safety.',
   'Raj needs scope tight enough to estimate. Priya needs to see where clinical risk sits and how it is mitigated. Sarah needs to recognise the Q3 direction she approved. Anything ambiguous will be resolved by engineering guessing.',
   '[{"initials":"RK","name":"Raj Kumar","role":"Engineering Lead · Builds this","trust":"neutral"},{"initials":"PR","name":"Priya Raman","role":"Clinical Safety Officer · Signs off","trust":"neutral"}]'::jsonb,
   '["Problem and outcome this delivers","User journeys in scope","Functional requirements, numbered","Out of scope, stated plainly","Clinical and data risks with mitigations","How success is measured"]'::jsonb,
   '[{"dimension":"Precision","hint":"Requirements should be testable, not aspirational."},{"dimension":"Audience fit","hint":"One document serving engineering and clinical safety without hiding either."},{"dimension":"Scope control","hint":"Out-of-scope statements prevent silent expansion."},{"dimension":"Measurement","hint":"Name the metric and its baseline, not a vague improvement."}]'::jsonb,
   'communication', 150),
  ('roadmap-draft', 2, 5, 'Draft the delivery roadmap', 'Week 2 · Task 5 of 5',
   'Sequence the work across the quarter so the first meaningful outcome lands before the board review in week 8.',
   'Six engineers, a hard board review in week 8, and an EPR integration backlog that cannot fully stop. Priya''s clinical review takes two weeks and cannot be parallelised with build for patient-facing changes.',
   '[{"initials":"SC","name":"Sarah Chen","role":"CEO · Board review week 8","trust":"high"},{"initials":"RK","name":"Raj Kumar","role":"Engineering Lead · Capacity","trust":"neutral"}]'::jsonb,
   '["Sequence and rationale","What lands before the board review","Dependencies and the critical path","Capacity assumptions you are making","Risks and the plan if week 8 slips"]'::jsonb,
   '[{"dimension":"Sequencing logic","hint":"Order should follow dependency and risk, not preference."},{"dimension":"Critical path","hint":"Name what cannot slip without moving the board date."},{"dimension":"Assumptions","hint":"State the capacity assumptions so they can be challenged."},{"dimension":"Contingency","hint":"Say what gets cut first, before you are forced to choose in week 7."}]'::jsonb,
   'delivery', 150)
) AS t(key, week, sort_order, title, phase_label, brief, context, stakeholders, sections, guidance, capability_key, min_words)
WHERE s.key = 'mediflow-q3-discovery';