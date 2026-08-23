-- Drop orphaned hybrid_search overload from migration 20260823020000.
-- That version had 6 params (min_relevance real). Our v5 has 5 params.
-- PostgREST sees both and can't disambiguate → "Could not choose the best candidate".
-- This migration removes the 6-param version so only v5 remains.

drop function if exists public.hybrid_search(text, vector(1536), integer, uuid, text, real);
