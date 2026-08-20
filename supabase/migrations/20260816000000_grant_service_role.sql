-- One Place: grant service_role full access to all public tables.
-- Supabase Cloud provisions these grants automatically; the self-hosted
-- docker image doesn't, which blocks server-side writes that bypass RLS.

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
