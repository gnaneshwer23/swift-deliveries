-- Allow reservation (and mission) deletes to drop reconciliation rows.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'psi_comparison_reconciliations_mission_id_spend_key_fkey'
  ) THEN
    ALTER TABLE public.psi_comparison_reconciliations
      DROP CONSTRAINT psi_comparison_reconciliations_mission_id_spend_key_fkey;
  END IF;
END $$;

ALTER TABLE public.psi_comparison_reconciliations
  ADD CONSTRAINT psi_comparison_reconciliations_mission_id_spend_key_fkey
  FOREIGN KEY (mission_id, spend_key)
  REFERENCES public.psi_comparison_reservations (mission_id, spend_key)
  ON DELETE CASCADE;
