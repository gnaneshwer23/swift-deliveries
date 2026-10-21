DROP POLICY IF EXISTS "Signed-in users can read frameworks" ON public.capability_frameworks;
CREATE POLICY "Signed-in users can read frameworks" ON public.capability_frameworks FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Signed-in users can read framework capabilities" ON public.framework_capabilities;
CREATE POLICY "Signed-in users can read framework capabilities" ON public.framework_capabilities FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users read event cards" ON public.event_cards;
CREATE POLICY "Authenticated users read event cards" ON public.event_cards FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users read scenario phases" ON public.scenario_phases;
CREATE POLICY "Authenticated users read scenario phases" ON public.scenario_phases FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.experience_scenarios s WHERE s.id = scenario_id AND s.enabled));

DROP POLICY IF EXISTS "Authenticated users read scenario stakeholders" ON public.scenario_stakeholders;
CREATE POLICY "Authenticated users read scenario stakeholders" ON public.scenario_stakeholders FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.experience_scenarios s WHERE s.id = scenario_id AND s.enabled));

DROP POLICY IF EXISTS "Authenticated users read scenario event cards" ON public.scenario_event_cards;
CREATE POLICY "Authenticated users read scenario event cards" ON public.scenario_event_cards FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.experience_scenarios s WHERE s.id = scenario_id AND s.enabled));