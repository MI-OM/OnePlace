-- One Place: shared public business listing/search function.
--
-- Powers homepage "featured", /search and /categories/[slug] with a single
-- query. security invoker + RLS means anon callers only ever see what the
-- public select policies allow (active businesses, published reviews, active
-- services).

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
    relevance real
)
language sql
stable
security invoker
set search_path = public
as $$
    select
        id,
        name,
        slug,
        description,
        primary_category_name,
        primary_category_slug,
        city,
        province,
        rating,
        review_count,
        price_from,
        services_count,
        relevance
    from (
        select
            b.id,
            b.name,
            b.slug,
            b.description,
            c.name as primary_category_name,
            c.slug as primary_category_slug,
            b.city,
            b.province,
            r.avg_rating as rating,
            r.review_count,
            s.price_from,
            s.services_count,
            greatest(
                similarity(b.name, coalesce(list_businesses.search_query, '')),
                similarity(coalesce(b.description, ''), coalesce(list_businesses.search_query, ''))
            ) as relevance,
            b.created_at
        from public.businesses b
        left join lateral (
            select category_id
            from public.business_categories
            where business_id = b.id
              and is_primary
            limit 1
        ) p on true
        left join public.categories c on c.id = p.category_id
        left join lateral (
            select round(avg(rr.rating)::numeric, 1) as avg_rating,
                   count(*)::bigint as review_count
            from public.reviews rr
            where rr.business_id = b.id
              and rr.status = 'published'
        ) r on true
        left join lateral (
            select min(coalesce(bs.min_price, bs.price))::numeric(12, 2) as price_from,
                   count(*)::bigint as services_count
            from public.business_services bs
            where bs.business_id = b.id
              and bs.is_active
        ) s on true
        where b.status = 'active'
          and b.deleted_at is null
          and (
              list_businesses.category_id is null
              or exists (
                  select 1
                  from public.business_categories bc
                  join public.categories cat on cat.id = bc.category_id
                  where bc.business_id = b.id
                    and (
                        bc.category_id = list_businesses.category_id
                        or cat.parent_id = list_businesses.category_id
                    )
              )
          )
          and (
              list_businesses.search_query is null
              or b.name ilike '%' || list_businesses.search_query || '%'
              or coalesce(b.description, '') ilike '%' || list_businesses.search_query || '%'
              or exists (
                  select 1
                  from public.business_services bs2
                  where bs2.business_id = b.id
                    and bs2.is_active
                    and (
                        bs2.name ilike '%' || list_businesses.search_query || '%'
                        or coalesce(bs2.description, '') ilike '%' || list_businesses.search_query || '%'
                    )
              )
          )
    ) results
    order by
        case when list_businesses.search_query is not null then results.relevance end desc nulls last,
        case when list_businesses.category_id is not null then results.name end asc nulls last,
        results.created_at desc
    limit max_results;
$$;

grant execute on function public.list_businesses(uuid, text, integer) to anon, authenticated;
