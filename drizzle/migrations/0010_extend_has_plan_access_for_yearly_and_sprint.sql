CREATE OR REPLACE FUNCTION public.has_plan_access(requested_user_id uuid, requested_product text, requested_environment text DEFAULT 'live'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = requested_user_id
      AND environment = requested_environment
      AND status IN ('active', 'trialing')
      AND (
        price_id IN ('complete_journey_monthly', 'complete_journey_yearly', 'career_sprint_pass')
        OR (requested_product IN ('experience', 'experience_monthly') AND price_id = 'experience_monthly')
        OR (requested_product IN ('launchpad', 'launchpad_monthly') AND price_id = 'launchpad_monthly')
      )
  );
$function$;