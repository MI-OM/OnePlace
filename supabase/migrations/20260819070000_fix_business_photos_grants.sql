-- OnePlace: grant service_role full CRUD on business_photos (was missing SELECT/INSERT/UPDATE).
GRANT SELECT, INSERT, UPDATE ON public.business_photos TO service_role;
