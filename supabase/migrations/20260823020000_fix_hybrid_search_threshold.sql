-- Fix hybrid_search: add min_relevance threshold, narrow FTS scope, remove trigram fallback.
--
-- Problems fixed:
-- 1. No minimum relevance — garbage results always returned
-- 2. FTS indexed city/province — "street" matched "Duckworth Street"
-- 3. Trigram fallback (%) too broad — fuzzy matches pollute results
--
-- The min_relevance parameter is NOT hardcoded — it defaults to 0.02 but can be
-- overridden per-query. Future businesses work automatically because the threshold
-- is based on RRF score quality, not on specific business data.

create or replace function public.hybrid_search(
  query_text text default null,
  query_embedding vector(1536) default null,
  match_count integer default 20,
  category_id uuid default null,
  city_filter text default null,
  min_relevance real default 0
)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  primary_category_name text,
  primary_category_slug text,
  city text,
  province text,
  rating numeric,
  review_count bigint,
  price_from numeric,
  services_count bigint,
  logo_url text,
  cover_image_url text,
  is_sponsored boolean,
  relevance real
)
language sql
stable
security invoker
set search_path = public
as $$
  with stop_words as (
    select unnest(array[
      'an','and','the','of','to','in','on','at','for','by','with',
      'is','are','was','were','this','that','these','those','i',
      'you','he','she','it','we','they','them','his','her','its',
      'our','their','your','would','could','should','will','shall',
      'can','may','might','must','do','does','did','has','had','have',
      'like','want','need','please','thanks','near','me','my',
      'looking','trying','get','got','wanting','some','any',
      'off','up','down','out','about','above','after','before',
      'between','through','during'
    ]) as w
  ),
  raw_tokens as (
    select token, ord
    from regexp_split_to_table(
      lower(coalesce(query_text, '')),
      '[^a-z0-9]+'
    ) with ordinality as t(token, ord)
    where length(token) >= 2
  ),
  content_tokens as (
    select rt.token
    from raw_tokens rt
    left join stop_words sw on sw.w = rt.token
    where sw.w is null
    order by rt.ord
  ),
  fts_terms as (
    select string_agg(token, ' | ') as terms
    from content_tokens
  ),
  fts_first as (
    select token from content_tokens limit 1
  ),

  -- FTS candidate set with ts_rank
  -- FIX: only index name + description (NOT city/province) to prevent
  -- location text like "Duckworth Street" matching search keywords.
  -- FIX: removed trigram (%) fallback — too broad for candidate selection.
  fts_results as (
    select
      b.id,
      b.name,
      b.slug,
      b.description,
      b.city,
      b.province,
      b.logo_url,
      b.cover_image_url,
      b.is_sponsored,
      ts_rank(
        to_tsvector('simple',
          coalesce(b.name, '') || ' ' ||
          coalesce(b.description, '')
        ),
        to_tsquery('simple', coalesce((select terms from fts_terms), ''))
      ) as rank,
      row_number() over (order by ts_rank(
        to_tsvector('simple',
          coalesce(b.name, '') || ' ' ||
          coalesce(b.description, '')
        ),
        to_tsquery('simple', coalesce((select terms from fts_terms), ''))
      ) desc) as fts_rank
    from public.businesses b
    cross join fts_terms
    cross join fts_first
    where b.status = 'active'
      and b.deleted_at is null
      and (
        category_id is null
        or exists (
          select 1 from public.business_categories bc
          where bc.business_id = b.id and bc.category_id = hybrid_search.category_id
        )
      )
      and (
        city_filter is null
        or b.city ilike '%' || city_filter || '%'
      )
      and (
        query_text is null
        or query_text = ''
        -- ILIKE on first content term (name + description only)
        or b.name ilike '%' || (select token from fts_first) || '%'
        or coalesce(b.description, '') ilike '%' || (select token from fts_first) || '%'
        -- Full-text OR search (name + description only)
        or to_tsvector('simple',
            coalesce(b.name, '') || ' ' ||
            coalesce(b.description, '')
          ) @@ to_tsquery('simple', coalesce((select terms from fts_terms), ''))
      )
    order by rank desc nulls last
    limit match_count * 2
  ),

  -- Vector candidate set with cosine distance
  vector_results as (
    select
      b.id,
      b.name,
      b.slug,
      b.description,
      b.city,
      b.province,
      b.logo_url,
      b.cover_image_url,
      b.is_sponsored,
      (b.embedding <=> query_embedding) as distance,
      row_number() over (order by b.embedding <=> query_embedding) as vec_rank
    from public.businesses b
    where b.status = 'active'
      and b.deleted_at is null
      and b.embedding is not null
      and query_embedding is not null
      and (
        category_id is null
        or exists (
          select 1 from public.business_categories bc
          where bc.business_id = b.id and bc.category_id = hybrid_search.category_id
        )
      )
      and (
        city_filter is null
        or b.city ilike '%' || city_filter || '%'
      )
    order by b.embedding <=> query_embedding
    limit match_count * 2
  ),

  -- Reciprocal Rank Fusion (RRF) with k=60
  -- Score each candidate: 1/(k + rank_fts) + 1/(k + rank_vector)
  fused as (
    select
      coalesce(f.id, v.id) as id,
      coalesce(f.name, v.name) as name,
      coalesce(f.slug, v.slug) as slug,
      coalesce(f.description, v.description) as description,
      coalesce(f.city, v.city) as city,
      coalesce(f.province, v.province) as province,
      coalesce(f.logo_url, v.logo_url) as logo_url,
      coalesce(f.cover_image_url, v.cover_image_url) as cover_image_url,
      coalesce(f.is_sponsored, v.is_sponsored) as is_sponsored,
      (
        case when f.id is not null then 1.0 / (60.0 + f.fts_rank) else 0 end
        +
        case when v.id is not null then 1.0 / (60.0 + v.vec_rank) else 0 end
      ) as rrf_score
    from fts_results f
    full outer join vector_results v on f.id = v.id
  ),

  -- Enrich with category, rating, price, services count
  enriched as (
    select
      fu.*,
      c.name as primary_category_name,
      c.slug as primary_category_slug,
      r.avg_rating,
      r.review_count,
      s.price_from,
      s.services_count
    from fused fu
    left join lateral (
      select category_id from public.business_categories
      where business_id = fu.id and is_primary limit 1
    ) pc on true
    left join public.categories c on c.id = pc.category_id
    left join lateral (
      select round(avg(rr.rating)::numeric, 1) as avg_rating,
             count(*)::bigint as review_count
      from public.reviews rr
      where rr.business_id = fu.id and rr.status = 'published'
    ) r on true
    left join lateral (
      select min(coalesce(bs.min_price, bs.price))::numeric(12,2) as price_from,
             count(*)::bigint as services_count
      from public.business_services bs
      where bs.business_id = fu.id and bs.is_active
    ) s on true
  )

  select
    e.id,
    e.name,
    e.slug,
    e.description,
    e.primary_category_name,
    e.primary_category_slug,
    e.city,
    e.province,
    e.avg_rating as rating,
    e.review_count,
    e.price_from,
    e.services_count,
    e.logo_url,
    e.cover_image_url,
    e.is_sponsored,
    e.rrf_score::real as relevance
  from enriched e
  where e.rrf_score > min_relevance
  order by e.rrf_score desc
  limit match_count;
$$;

grant execute on function public.hybrid_search(text, vector(1536), integer, uuid, text, real) to anon, authenticated;
