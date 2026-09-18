CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text NOT NULL,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL CHECK (price_id IN ('experience_monthly', 'launchpad_monthly', 'complete_journey_monthly')),
  status text NOT NULL DEFAULT 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'live')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stripe_subscription_id, environment)
);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

CREATE INDEX subscriptions_user_environment_idx ON public.subscriptions(user_id, environment, created_at DESC);
CREATE INDEX subscriptions_stripe_environment_idx ON public.subscriptions(stripe_subscription_id, environment);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role manages subscriptions"
ON public.subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.has_plan_access(
  requested_user_id uuid,
  requested_product text,
  requested_environment text DEFAULT 'live'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = requested_user_id
      AND environment = requested_environment
      AND status IN ('active', 'trialing')
      AND (
        price_id = requested_product
        OR price_id = 'complete_journey_monthly'
      )
  );
$$;

REVOKE ALL ON FUNCTION public.has_plan_access(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_plan_access(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_plan_access(uuid, text, text) TO service_role;