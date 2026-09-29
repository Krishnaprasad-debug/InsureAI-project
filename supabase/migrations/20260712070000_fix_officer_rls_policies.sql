-- ============================================================
-- Fix Officer & Admin RLS Policies for InsureAI (Recursion-Safe)
-- Uses a SECURITY DEFINER helper function to safely check officer
-- roles without causing infinite recursion on the profiles table.
-- ============================================================

-- ------------------------------------------------------------
-- Security Definer Helper Function
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_officer(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role IN ('company', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------
-- CLAIMS Policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "select_own_claims" ON claims;
DROP POLICY IF EXISTS "select_all_claims_for_officers" ON claims;
CREATE POLICY "select_all_claims_for_officers" ON claims FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR public.is_officer(auth.uid())
  );

DROP POLICY IF EXISTS "update_own_claims" ON claims;
DROP POLICY IF EXISTS "update_claims_for_officers" ON claims;
CREATE POLICY "update_claims_for_officers" ON claims FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR public.is_officer(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR public.is_officer(auth.uid())
  );

-- ------------------------------------------------------------
-- PREDICTIONS Policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "select_own_predictions" ON predictions;
DROP POLICY IF EXISTS "select_all_predictions_for_officers" ON predictions;
CREATE POLICY "select_all_predictions_for_officers" ON predictions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR public.is_officer(auth.uid())
  );

-- ------------------------------------------------------------
-- PROFILES Policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "select_all_profiles_for_officers" ON profiles;
CREATE POLICY "select_all_profiles_for_officers" ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR public.is_officer(auth.uid())
  );
