ALTER TABLE public.user_financial_profiles
  ADD COLUMN IF NOT EXISTS current_savings NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS monthly_rent_emi NUMERIC(12, 2);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_financial_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_financial_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_financial_profiles;
CREATE POLICY "Users can update own profile" ON public.user_financial_profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
