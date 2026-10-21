GRANT SELECT ON public.credentials TO anon;
CREATE POLICY "Credentials are publicly verifiable"
  ON public.credentials FOR SELECT TO anon USING (true);