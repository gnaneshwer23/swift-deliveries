CREATE UNIQUE INDEX evidence_ledger_one_coaching_entry_per_version
ON public.evidence_ledger (artefact_version_id)
WHERE source = 'coaching_submission';