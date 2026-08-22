-- Fix: Ensure all business_members have corresponding profiles rows
-- Run this migration once to repair existing data after the ensureProfilesRow
-- fix was added to inviteStaff.

DO $$
DECLARE
  member user_id;
BEGIN
  FOR member IN SELECT user_id FROM public.business_members WHERE status = 'active' LOOP
    PERFORM * FROM public.profiles WHERE id = member.user_id;
    IF NOT FOUND THEN
      INSERT INTO public.profiles (id, display_name, first_name, last_name, avatar_url, bio)
      VALUES (member.user_id, 'Team Member', NULL, NULL, NULL, NULL);
    END IF;
  END LOOP;
END $$;