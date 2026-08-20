create or replace function public.list_businesses(
    category_id uuid default null,
    search_query text default null,
    max_results integer default 30
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
    relevance real,
    logo_url text,
    cover_image_url text,
    is_sponsored boolean
)
language sql
stable
security invoker
set search_path = public
as $$
    with stop_words as (
        select unnest(ARRAY[
            'an','and','the','of','to','in','on','at','for','by','with',
            'is','are','was','were','this','that','these','those','i',
            'you','he','she','it','we','they','them','his','her','its',
            'our','their','your','mine','yours','would','could','should',
            'will','shall','can','may','might','must','do','does','did',
            'has','had','have','like','want','need','next','week','when',
            'where','today','tomorrow','now','soon','looking','trying',
            'me','my','near','affordable','cheap','budget','get','got',
            'please','thanks'
        ]) as w
    ),
    raw_tokens as (
        select token, ord
        from regexp_split_to_table(
            lower(coalesce(list_businesses.search_query, '')),
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
    params as (
        select
            list_businesses.search_query as q,
            list_businesses.category_id as cat,
            list_businesses.max_results as lim,
            (select string_agg(token, ' | ') from content_tokens) as terms,
            (select token from content_tokens limit 1) as first_term
    )
    select
        b.id, b.name, b.slug, b.description,
        c.name as primary_category_name, c.slug as primary_category_slug,
        b.city, b.province,
        r.avg_rating as rating, r.review_count,
        s.price_from, s.services_count,
        greatest(
            nullif(similarity(b.name, coalesce(params.q, '')), 0),
            nullif(similarity(coalesce(b.description, ''), coalesce(params.q, '')), 0),
            nullif(similarity(coalesce(cat_agg.cat_names, ''), coalesce(params.q, '')), 0),
            nullif(similarity(coalesce(svc_agg.svc_names, ''), coalesce(params.q, '')), 0)
        ) as relevance,
        b.logo_url, b.cover_image_url,
        b.is_sponsored
    from public.businesses b
    cross join params
    left join lateral (
        select category_id from public.business_categories
        where business_id = b.id and is_primary limit 1
    ) p on true
    left join public.categories c on c.id = p.category_id
    left join lateral (
        select round(avg(rr.rating)::numeric, 1) as avg_rating,
               count(*)::bigint as review_count
        from public.reviews rr
        where rr.business_id = b.id and rr.status = 'published'
    ) r on true
    left join lateral (
        select min(coalesce(bs.min_price, bs.price))::numeric(12, 2) as price_from,
               count(*)::bigint as services_count
        from public.business_services bs
        where bs.business_id = b.id and bs.is_active
    ) s on true
    left join lateral (
        select string_agg(cat2.name, ' ') as cat_names
        from public.business_categories bc2
        join public.categories cat2 on cat2.id = bc2.category_id
        where bc2.business_id = b.id and cat2.is_active
    ) cat_agg on true
    left join lateral (
        select string_agg(bs2.name || ' ' || coalesce(bs2.description, ''), ' ') as svc_names
        from public.business_services bs2
        where bs2.business_id = b.id and bs2.is_active
    ) svc_agg on true
    where b.status = 'active'
      and b.deleted_at is null
      and (params.cat is null or exists (
          select 1 from public.business_categories bc
          join public.categories cat on cat.id = bc.category_id
          where bc.business_id = b.id
            and (bc.category_id = params.cat or cat.parent_id = params.cat)
      ))
      and (
          params.q is null
          or (params.first_term is not null and (
              b.name ilike '%' || params.first_term || '%'
              or coalesce(b.description, '') ilike '%' || params.first_term || '%'
          ))
          or exists (
              select 1 from public.business_categories bc2
              join public.categories cat2 on cat2.id = bc2.category_id
              where bc2.business_id = b.id
                and (cat2.name ilike '%' || params.first_term || '%' or cat2.slug ilike '%' || params.first_term || '%')
          )
          or exists (
              select 1 from public.business_services bs2
              where bs2.business_id = b.id and bs2.is_active
                and (bs2.name ilike '%' || params.first_term || '%' or coalesce(bs2.description, '') ilike '%' || params.first_term || '%')
          )
          or to_tsvector('simple',
              coalesce(b.name, '') || ' ' || coalesce(b.description, '') || ' '
              || coalesce(cat_agg.cat_names, '') || ' ' || coalesce(svc_agg.svc_names, '')
          ) @@ to_tsquery('simple', coalesce(params.terms, ''))
          or (params.first_term is not null and (
              b.name % params.first_term or coalesce(b.description, '') % params.first_term
          ))
      )
    order by
        b.is_sponsored desc,
        case when params.q is not null then (
            ts_rank(to_tsvector('simple',
                coalesce(b.name, '') || ' ' || coalesce(b.description, '') || ' '
                || coalesce(c.name, '') || ' ' || coalesce(cat_agg.cat_names, '') || ' ' || coalesce(svc_agg.svc_names, '')
            ), to_tsquery('simple', coalesce(params.terms, '')))
        ) + coalesce(greatest(
            nullif(similarity(b.name, coalesce(params.q, '')), 0),
            nullif(similarity(coalesce(b.description, ''), coalesce(params.q, '')), 0),
            nullif(similarity(coalesce(cat_agg.cat_names, ''), coalesce(params.q, '')), 0),
            nullif(similarity(coalesce(svc_agg.svc_names, ''), coalesce(params.q, '')), 0)
        ), 0) end desc nulls last,
        case when params.cat is not null then b.name end asc nulls last,
        b.created_at desc
    limit list_businesses.max_results;
$$;

grant execute on function public.list_businesses(uuid, text, integer) to anon, authenticated;
