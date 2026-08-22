-- Rewrite hybrid_search: FTS as gatekeeper, vector as ranking boost.
--
-- DESIGN PRINCIPLE: Only businesses that FTS matches are ever returned.
-- Vector search makes good results better — it never creates false positives.
-- If FTS finds 0 matches → 0 results → "No results found" in UI.
-- No hardcoded thresholds. No min_relevance. Pure ranking.
--
-- FTS indexes ALL searchable fields:
--   business name + description + category names + service names/descriptions
--   + knowledge item content (critical for community services, etc.)

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

  -- Tokenize the query
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

  -- Build FTS query terms (OR semantics)
  fts_terms as (
    select coalesce(string_agg(token, ' | '), '') as terms
    from content_tokens
  ),

  -- First content term for ILIKE matching
  fts_first as (
    select coalesce((select token from content_tokens limit 1), '') as term
  ),

  -- Pre-load category names and service names per business (avoids repeated lateral joins)
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
      -- Aggregate knowledge item content
      coalesce((
        select string_agg(ki.content, ' ')
        from public.ai_knowledge_items ki
        where ki.business_id = b.id and ki.is_active
      ), '') as knowledge_text
    from public.businesses b
    where b.status = 'active'
      and b.deleted_at is null
  ),

  -- ============================================================================
  -- FTS CANDIDATE SET (gatekeeper — only these businesses can appear in results)
  -- ============================================================================
  -- Matches against: name + description + categories + services + knowledge
  -- Uses three matching strategies (ILIKE, tsvector OR, trigram) for maximum coverage.
  fts_results as (
    select
      biz.id,
      biz.name,
      biz.description,
      biz.cat_names,
      biz.svc_names,
      biz.knowledge_text,
      biz.city,
      biz.province,
      biz.logo_url,
      biz.cover_image_url,
      biz.is_sponsored,
      biz.embedding,
      -- Combined searchable text for ranking
      biz.name || ' ' ||
      biz.description || ' ' ||
      biz.cat_names || ' ' ||
      biz.svc_names || ' ' ||
      biz.knowledge_text as full_text,
      -- FTS rank
      ts_rank(
        to_tsvector('simple',
          coalesce(biz.name, '') || ' ' ||
          coalesce(biz.description, '') || ' ' ||
          coalesce(biz.cat_names, '') || ' ' ||
          coalesce(biz.svc_names, '') || ' ' ||
          coalesce(biz.knowledge_text, '')
        ),
        to_tsquery('simple', (select terms from fts_terms))
      ) as fts_rank
    from biz_text biz
    cross join fts_terms
    cross join fts_first
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
      -- Strategy 1: ILIKE on first content term (name, description, categories, services, knowledge)
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
      -- Strategy 3: Trigram similarity for typos (name + description only)
      or biz.name % (select term from fts_first)
      or biz.description % (select term from fts_first)
    )
    order by fts_rank desc nulls last
    limit match_count * 2
  ),

  -- ============================================================================
  -- RANKING: FTS rank + optional vector boost
  -- ============================================================================
  -- Vector boost is computed only when both query_embedding and business embedding exist.
  -- Closer vector distance = better boost. Businesses without embeddings get no boost.
  ranked as (
    select
      f.id,
      f.name,
      null as slug,               -- populated in final select
      f.description,
      null as primary_category_name,  -- populated below
      null as primary_category_slug,
      f.city,
      f.province,
      f.logo_url,
      f.cover_image_url,
      f.is_sponsored,
      -- Combined ranking score:
      -- FTS rank (higher = better) + vector boost (closer = higher score)
      f.fts_rank as rank_score,
      -- Vector distance (lower = closer = better). NULL when no embedding available.
      case
        when query_embedding is not null and f.embedding is not null
        then f.embedding <=> query_embedding
        else null
      end as vec_distance
    from fts_results f
  )

  -- ============================================================================
  -- FINAL OUTPUT: enrich with category, rating, price, order by combined ranking
  -- ============================================================================
  select
    r.id,
    r.name,
    b.slug,
    r.description,
    c.name as primary_category_name,
    c.slug as primary_category_slug,
    r.city,
    r.province,
    rev.avg_rating as rating,
    rev.review_count,
    svc.price_from,
    svc.services_count,
    r.logo_url,
    r.cover_image_url,
    r.is_sponsored,
    -- Relevance score: FTS rank boosted by vector proximity
    -- When vec_distance is NULL (no embedding), pure FTS rank
    -- When vec_distance exists, FTS rank gets a small boost for closer vectors
    case
      when r.vec_distance is not null
      then (r.rank_score + (1.0 - r.vec_distance))::real
      else r.rank_score::real
    end as relevance
  from ranked r
  join public.businesses b on b.id = r.id
  left join lateral (
    select category_id from public.business_categories
    where business_id = r.id and is_primary limit 1
  ) pc on true
  left join public.categories c on c.id = pc.category_id
  left join lateral (
    select round(avg(rr.rating)::numeric, 1) as avg_rating,
           count(*)::bigint as review_count
    from public.reviews rr
    where rr.business_id = r.id and rr.status = 'published'
  ) rev on true
  left join lateral (
    select min(coalesce(bs.min_price, bs.price))::numeric(12,2) as price_from,
           count(*)::bigint as services_count
    from public.business_services bs
    where bs.business_id = r.id and bs.is_active
  ) svc on true
  order by
    -- Primary: FTS rank (text relevance)
    r.rank_score desc,
    -- Secondary: vector proximity (closer = better, NULLs last)
    r.vec_distance asc nulls last,
    -- Tertiary: review count (more popular = better)
    rev.review_count desc nulls last
  limit match_count;
$$;

grant execute on function public.hybrid_search(text, vector(1536), integer, uuid, text) to anon, authenticated;
