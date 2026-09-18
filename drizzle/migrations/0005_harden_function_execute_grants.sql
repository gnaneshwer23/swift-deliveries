-- These SECURITY DEFINER functions all require auth.uid(); anonymous callers must not reach them.
REVOKE EXECUTE ON FUNCTION public.has_plan_access(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_workspace_contribution(uuid, text, text, uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_workspace_document(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.review_performance_review(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.review_performance_review(uuid, text, text) FROM PUBLIC;

-- Trust-rail guards must also apply to the coaching review RPCs, which run as invoker.
REVOKE EXECUTE ON FUNCTION public.create_coaching_submission(uuid, text, text, public.coaching_intake_method, text, text, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.review_coaching_submission(uuid, public.coach_review_decision, text) FROM anon;