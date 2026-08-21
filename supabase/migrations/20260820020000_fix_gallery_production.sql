-- Fix gallery upload failures in production
-- 1. Grant DELETE to service_role on business_photos (updateBusinessImages does delete-then-reinsert)
-- 2. Force business-images bucket to public (ON CONFLICT DO NOTHING won't flip an existing private bucket)

GRANT DELETE ON public.business_photos TO service_role;

UPDATE storage.buckets SET public = true WHERE id = 'business-images';
