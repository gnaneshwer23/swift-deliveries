INSERT INTO public.coaching_exercises (programme_id, framework_capability_id, key, title, instructions, artefact_type, sort_order)
SELECT p.id, fc.id, x.key, x.title, x.instructions, x.artefact_type, x.sort_order
FROM public.coaching_programmes p
JOIN (VALUES
  ('pmf-discovery-brief', 'discovery', 'Problem framing brief', 'Take a product area you know. Write a one-page brief that states the problem, who has it, the evidence you have, the evidence you are missing, and how you would find it. Name the assumption that would most change your plan if it were wrong.', 'business_case', 1),
  ('pmf-prioritisation-call', 'prioritisation', 'Prioritisation decision record', 'You have four candidate items and capacity for two. Record the decision: the options, the criteria you used, the trade-off you accepted, what you deliberately dropped, and how you would know the call was wrong.', 'roadmap', 2),
  ('pmf-stakeholder-map', 'stakeholders', 'Stakeholder map and cadence', 'Map the stakeholders for a delivery you have run or can describe credibly. For each, state their interest, their influence, what they need from you, and the cadence you agreed. Call out the two hardest relationships and how you handled them.', 'stakeholder_map', 3)
) AS x(key, capability_key, title, instructions, artefact_type, sort_order)
  ON TRUE
JOIN public.framework_capabilities fc ON fc.key = x.capability_key
JOIN public.capability_frameworks f ON f.id = fc.framework_id AND f.id = p.framework_id
WHERE p.key = 'pm-foundations'
ON CONFLICT DO NOTHING;