-- Hybrid search v6: cosine threshold + field-weighted ranking.
--
-- Fixes from v5:
--   1. Vector search admitted ALL embedded businesses (no similarity threshold)
--      → false positives like Salvation Army appearing for "hair" queries.
--      FIX: cosine distance < 0.7 threshold on vector_results.
--   2. FTS ranking treated all fields equally — "hair" in a knowledge item
--      ranked the same as "Hair" in the business name.
--      FIX: field-weighted scoring — name ×10, category ×5, services ×2,
--      knowledge ×1, description ×0.5 added to ts_rank.
--   3. OR semantics with enriched terms (braid | hair | braiding | salon | stylist)
--      matched half the beauty industry.
--      FIX: require at least one core term to match in name or category
--      when query has 2+ terms — prevents noise from expanded/LLM terms.

-- DROP all prior overloads to prevent PostgREST ambiguity errors.
drop function if exists public.hybrid_search(text, vector(1536), integer, uuid, text, real);
drop function if exists public.hybrid_search(text, vector(1536), integer, uuid, text);

create or replace function public.hybrid_search(
  query_text text default null,
  query_embedding vector(1536) default null,
  match_count integer default 20,
  category_id uuid default null,
  city_filter text default null
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
security definer
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

  -- FTS query terms joined with OR semantics
  fts_terms as (
    select coalesce(string_agg(token, ' | '), '') as terms
    from content_tokens
  ),

  -- First content term for ILIKE matching (handle empty gracefully)
  fts_first as (
    select coalesce((select token from content_tokens limit 1), '') as term
  ),

  -- Count of content terms (for admission filtering)
  token_count as (
    select count(*)::int as cnt from content_tokens
  ),

  -- Pre-load all searchable text per business (avoids repeated lateral joins)
  biz_text as (
    select
      b.id,
      b.name,
      b.description,
      b.city,
      b.province,
      b.logo_url,
      b.cover_image_url,
      b.is_sponsored,
      b.embedding,
      -- Aggregate category names
      coalesce((
        select string_agg(cat.name, ' ')
        from public.business_categories bc
        join public.categories cat on cat.id = bc.category_id
        where bc.business_id = b.id and cat.is_active
      ), '') as cat_names,
      -- Aggregate service names + descriptions
      coalesce((
        select string_agg(bs.name || ' ' || coalesce(bs.description, ''), ' ')
        from public.business_services bs
        where bs.business_id = b.id and bs.is_active
      ), '') as svc_names,
      -- Aggregate knowledge item titles + content
      coalesce((
        select string_agg(ki.title || ' ' || ki.content, ' ')
        from public.ai_knowledge_items ki
        where ki.business_id = b.id and ki.is_active
      ), '') as knowledge_text
    from public.businesses b
    where b.status = 'active'
      and b.deleted_at is null
  ),

  -- ============================================================================
  -- FTS CANDIDATE SET with field-weighted scoring
  -- ============================================================================
  -- Matching: ILIKE (first term) + tsvector OR + trigram (typos)
  -- Ranking: ts_rank + field-weighted boost (name > category > service > knowledge)
  fts_results as (
    select
      biz.id,
      biz.name,
      biz.city,
      biz.province,
      biz.logo_url,
      biz.cover_image_url,
      biz.is_sponsored,
      -- Base FTS rank
      ts_rank(
        to_tsvector('simple',
          coalesce(biz.name, '') || ' ' ||
          coalesce(biz.description, '') || ' ' ||
          coalesce(biz.cat_names, '') || ' ' ||
          coalesce(biz.svc_names, '') || ' ' ||
          coalesce(biz.knowledge_text, '')
        ),
        to_tsquery('simple', (select terms from fts_terms))
      ) as base_rank,
      -- Field-weighted boost: name match matters most, knowledge least
      (
        (case when biz.name ilike '%' || (select term from fts_first) || '%' then 10.0
              when to_tsvector('simple', coalesce(biz.name, '')) @@ to_tsquery('simple', (select terms from fts_terms)) then 8.0
              else 0 end)
        +
        (case when biz.cat_names ilike '%' || (select term from fts_first) || '%' then 5.0
              when to_tsvector('simple', coalesce(biz.cat_names, '')) @@ to_tsquery('simple', (select terms from fts_terms)) then 4.0
              else 0 end)
        +
        (case when biz.svc_names ilike '%' || (select term from fts_first) || '%' then 2.0
              when to_tsvector('simple', coalesce(biz.svc_names, '')) @@ to_tsquery('simple', (select terms from fts_terms)) then 1.5
              else 0 end)
        +
        (case when biz.knowledge_text ilike '%' || (select term from fts_first) || '%' then 1.0
              when to_tsvector('simple', coalesce(biz.knowledge_text, '')) @@ to_tsquery('simple', (select terms from fts_terms)) then 0.5
              else 0 end)
        +
        (case when biz.description ilike '%' || (select term from fts_first) || '%' then 0.5
              else 0 end)
      ) as field_boost,
      -- Combined rank = base FTS rank + field boost (higher = better)
      ts_rank(
        to_tsvector('simple',
          coalesce(biz.name, '') || ' ' ||
          coalesce(biz.description, '') || ' ' ||
          coalesce(biz.cat_names, '') || ' ' ||
          coalesce(biz.svc_names, '') || ' ' ||
          coalesce(biz.knowledge_text, '')
        ),
        to_tsquery('simple', (select terms from fts_terms))
      ) +
      (
        (case when biz.name ilike '%' || (select term from fts_first) || '%' then 10.0
              when to_tsvector('simple', coalesce(biz.name, '')) @@ to_tsquery('simple', (select terms from fts_terms)) then 8.0
              else 0 end)
        +
        (case when biz.cat_names ilike '%' || (select term from fts_first) || '%' then 5.0
              when to_tsvector('simple', coalesce(biz.cat_names, '')) @@ to_tsquery('simple', (select terms from fts_terms)) then 4.0
              else 0 end)
        +
        (case when biz.svc_names ilike '%' || (select term from fts_first) || '%' then 2.0
              when to_tsvector('simple', coalesce(biz.svc_names, '')) @@ to_tsquery('simple', (select terms from fts_terms)) then 1.5
              else 0 end)
        +
        (case when biz.knowledge_text ilike '%' || (select term from fts_first) || '%' then 1.0
              when to_tsvector('simple', coalesce(biz.knowledge_text, '')) @@ to_tsquery('simple', (select terms from fts_terms)) then 0.5
              else 0 end)
        +
        (case when biz.description ilike '%' || (select term from fts_first) || '%' then 0.5
              else 0 end)
      ) as fts_rank,
      -- Row number for RRF (1-based rank)
      row_number() over (
        order by
          ts_rank(
            to_tsvector('simple',
              coalesce(biz.name, '') || ' ' ||
              coalesce(biz.description, '') || ' ' ||
              coalesce(biz.cat_names, '') || ' ' ||
              coalesce(biz.svc_names, '') || ' ' ||
              coalesce(biz.knowledge_text, '')
            ),
            to_tsquery('simple', (select terms from fts_terms))
          ) +
          (
            (case when biz.name ilike '%' || (select term from fts_first) || '%' then 10.0
                  when to_tsvector('simple', coalesce(biz.name, '')) @@ to_tsquery('simple', (select terms from fts_terms)) then 8.0
                  else 0 end)
            +
            (case when biz.cat_names ilike '%' || (select term from fts_first) || '%' then 5.0
                  when to_tsvector('simple', coalesce(biz.cat_names, '')) @@ to_tsquery('simple', (select terms from fts_terms)) then 4.0
                  else 0 end)
            +
            (case when biz.svc_names ilike '%' || (select term from fts_first) || '%' then 2.0
                  when to_tsvector('simple', coalesce(biz.svc_names, '')) @@ to_tsquery('simple', (select terms from fts_terms)) then 1.5
                  else 0 end)
            +
            (case when biz.knowledge_text ilike '%' || (select term from fts_first) || '%' then 1.0
                  when to_tsvector('simple', coalesce(biz.knowledge_text, '')) @@ to_tsquery('simple', (select terms from fts_terms)) then 0.5
                  else 0 end)
            +
            (case when biz.description ilike '%' || (select term from fts_first) || '%' then 0.5
                  else 0 end)
          ) desc nulls last
      ) as fts_rank_num
    from biz_text biz
    cross join fts_terms
    cross join fts_first
    cross join token_count
    where (
      -- Category filter
      category_id is null
      or exists (
        select 1 from public.business_categories bc
        where bc.business_id = biz.id and bc.category_id = hybrid_search.category_id
      )
    )
    and (
      -- City filter
      city_filter is null
      or biz.city ilike '%' || city_filter || '%'
    )
    and (
      -- No query = show all (category browse mode)
      query_text is null
      or query_text = ''
      -- Strategy 1: ILIKE on first content term across ALL searchable fields
      or biz.name ilike '%' || (select term from fts_first) || '%'
      or biz.description ilike '%' || (select term from fts_first) || '%'
      or biz.cat_names ilike '%' || (select term from fts_first) || '%'
      or biz.svc_names ilike '%' || (select term from fts_first) || '%'
      or biz.knowledge_text ilike '%' || (select term from fts_first) || '%'
      -- Strategy 2: Full-text OR search across all fields
      or to_tsvector('simple',
          coalesce(biz.name, '') || ' ' ||
          coalesce(biz.description, '') || ' ' ||
          coalesce(biz.cat_names, '') || ' ' ||
          coalesce(biz.svc_names, '') || ' ' ||
          coalesce(biz.knowledge_text, '')
        ) @@ to_tsquery('simple', (select terms from fts_terms))
      -- Strategy 3: Trigram similarity for typos (name + description)
      or biz.name % (select term from fts_first)
      or biz.description % (select term from fts_first)
    )
    -- ADMISSION FILTER: when query has 2+ terms, require at least one
    -- high-signal match (name or category) to prevent noise from expanded
    -- LLM terms like "salon stylist" matching half the beauty industry.
    and (
      (select cnt from token_count) <= 1
      or biz.name ilike '%' || (select term from fts_first) || '%'
      or biz.cat_names ilike '%' || (select term from fts_first) || '%'
      or to_tsvector('simple', coalesce(biz.name, '')) @@ to_tsquery('simple', (select terms from fts_terms))
      or to_tsvector('simple', coalesce(biz.cat_names, '')) @@ to_tsquery('simple', (select terms from fts_terms))
    )
    limit match_count * 2
  ),

  -- ============================================================================
  -- VECTOR CANDIDATE SET with cosine distance threshold
  -- ============================================================================
  -- Threshold < 0.7 filters out semantically unrelated businesses.
  -- With text-embedding-3-small: <0.5 = strong match, 0.5-0.7 = moderate.
  vector_results as (
    select
      b.id,
      b.name,
      b.city,
      b.province,
      b.logo_url,
      b.cover_image_url,
      b.is_sponsored,
      (b.embedding <=> query_embedding) as vec_distance,
      row_number() over (order by b.embedding <=> query_embedding) as vec_rank
    from public.businesses b
    where b.status = 'active'
      and b.deleted_at is null
      and b.embedding is not null
      and query_embedding is not null
      and (b.embedding <=> query_embedding) < 0.7
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

  -- ============================================================================
  -- RRF FUSION
  -- ============================================================================
  -- Score = 1/(k + rank_fts) + 1/(k + rank_vec)
  -- k=60. Vector threshold ensures only semantically related businesses appear.
  fused as (
    select
      coalesce(f.id, v.id) as id,
      coalesce(f.name, v.name) as name,
      coalesce(f.city, v.city) as city,
      coalesce(f.province, v.province) as province,
      coalesce(f.logo_url, v.logo_url) as logo_url,
      coalesce(f.cover_image_url, v.cover_image_url) as cover_image_url,
      coalesce(f.is_sponsored, v.is_sponsored) as is_sponsored,
      coalesce(f.fts_rank, 0) as fts_rank,
      v.vec_distance,
      (
        case when f.id is not null then 1.0 / (60.0 + f.fts_rank_num) else 0 end
        +
        case when v.id is not null then 1.0 / (60.0 + v.vec_rank) else 0 end
      ) as rrf_score
    from fts_results f
    full outer join vector_results v on f.id = v.id
  )

  -- ============================================================================
  -- FINAL OUTPUT: enrich with category, rating, price, order by RRF score
  -- ============================================================================
  select
    fu.id,
    fu.name,
    b.slug,
    b.description,
    c.name as primary_category_name,
    c.slug as primary_category_slug,
    fu.city,
    fu.province,
    rev.avg_rating as rating,
    rev.review_count,
    svc.price_from,
    svc.services_count,
    fu.logo_url,
    fu.cover_image_url,
    fu.is_sponsored,
    fu.rrf_score::real as relevance
  from fused fu
  join public.businesses b on b.id = fu.id
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
  ) rev on true
  left join lateral (
    select min(coalesce(bs.min_price, bs.price))::numeric(12,2) as price_from,
           count(*)::bigint as services_count
    from public.business_services bs
    where bs.business_id = fu.id and bs.is_active
  ) svc on true
  where fu.rrf_score > 0
  order by
    fu.rrf_score desc,
    fu.fts_rank desc nulls last,
    fu.vec_distance asc nulls last,
    rev.review_count desc nulls last
  limit match_count;
$$;

grant execute on function public.hybrid_search(text, vector(1536), integer, uuid, text) to anon, authenticated;
