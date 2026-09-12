CREATE TABLE public.portfolio_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  include_self_reported boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  revoked_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX portfolio_shares_owner_idx ON public.portfolio_shares (owner_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.portfolio_shares TO authenticated;
GRANT ALL ON public.portfolio_shares TO service_role;

ALTER TABLE public.portfolio_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their shares" ON public.portfolio_shares
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Owners create their shares" ON public.portfolio_shares
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners revoke their shares" ON public.portfolio_shares
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);