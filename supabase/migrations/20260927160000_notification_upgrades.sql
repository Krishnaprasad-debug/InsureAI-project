ALTER TABLE notifications ADD COLUMN IF NOT EXISTS claim_id uuid REFERENCES claims(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_role text;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
DROP POLICY IF EXISTS "select_notifications_for_officers" ON notifications;
CREATE POLICY "select_notifications_for_officers" ON notifications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR (target_role = 'company' AND public.is_officer(auth.uid()))
  );

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "update_notifications_for_officers" ON notifications;
CREATE POLICY "update_notifications_for_officers" ON notifications FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR (target_role = 'company' AND public.is_officer(auth.uid()))
  )
  WITH CHECK (
    auth.uid() = user_id OR (target_role = 'company' AND public.is_officer(auth.uid()))
  );
