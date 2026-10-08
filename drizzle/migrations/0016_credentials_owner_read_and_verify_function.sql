DROP POLICY "Credentials are publicly verifiable" ON public.credentials;

CREATE POLICY "Owners can read their own credentials"
ON public.credentials
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.verify_credential(_credential_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', c.id,
    'status', c.status,
    'issued_at', c.issued_at,
    'credential_json', c.credential_json
  )
  FROM public.credentials c
  WHERE c.id = _credential_id
$$;

GRANT EXECUTE ON FUNCTION public.verify_credential(uuid) TO anon, authenticated;