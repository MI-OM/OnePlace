-- Fix: anon role needs SELECT grant on business_photos
-- Without this, RLS policies are never evaluated (permission denied before RLS runs)

grant select on public.business_photos to anon;
