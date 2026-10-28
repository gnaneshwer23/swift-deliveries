-- P1 Stripe sandbox: allow paid activations on psi_pilot_activations.
-- Additive and re-runnable. Does not apply to production without owner approval.
-- See docs/psi-stripe-catalog.md and docs/migrations-and-rollback.md.

-- Drop the manual-only payment_taken = false check (name from 0021 inline CHECK).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'psi_pilot_activations_payment_taken_check'
      AND conrelid = 'public.psi_pilot_activations'::regclass
  ) THEN
    ALTER TABLE public.psi_pilot_activations
      DROP CONSTRAINT psi_pilot_activations_payment_taken_check;
  END IF;
END $$;

-- Self-serve checkout may activate without a prior enquiry row.
ALTER TABLE public.psi_pilot_activations
  ALTER COLUMN request_id DROP NOT NULL;

ALTER TABLE public.psi_pilot_activations
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_lookup_key text,
  ADD COLUMN IF NOT EXISTS payment_environment text
    CHECK (
      payment_environment IS NULL
      OR payment_environment IN ('sandbox', 'live')
    );

CREATE UNIQUE INDEX IF NOT EXISTS psi_pilot_activations_stripe_session_uidx
  ON public.psi_pilot_activations (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS psi_pilot_activations_stripe_subscription_idx
  ON public.psi_pilot_activations (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
