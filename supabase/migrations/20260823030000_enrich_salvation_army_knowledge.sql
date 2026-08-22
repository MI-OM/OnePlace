-- Enrich Salvation Army knowledge base with terms people actually search for.
-- "Supportive housing" is the official term, but people search "shelter",
-- "homeless", "accommodation", "emergency housing". Add knowledge items
-- that contain these natural-language terms so FTS and vector search
-- can find this business for urgent community-service queries.

-- Columns: id, business_id, title, content, category, priority, is_active, metadata, created_at

insert into public.ai_knowledge_items (id, business_id, title, content, category, priority, is_active, metadata, created_at)
select
  gen_random_uuid(),
  b.id,
  'Emergency Shelter & Housing',
  'The Salvation Army provides emergency shelter and supportive housing for people experiencing homelessness. If you need a place to stay, accommodation, or are sleeping rough, we can help with immediate shelter and long-term housing support.',
  'services',
  10,
  true,
  '{}'::jsonb,
  now()
from public.businesses b
where b.name ilike '%Salvation Army%'
  and not exists (
    select 1 from public.ai_knowledge_items k
    where k.business_id = b.id
      and k.title = 'Emergency Shelter & Housing'
  );

insert into public.ai_knowledge_items (id, business_id, title, content, category, priority, is_active, metadata, created_at)
select
  gen_random_uuid(),
  b.id,
  'Homeless Services',
  'For individuals who are homeless or at risk of homelessness: we offer emergency accommodation, supportive housing applications, NLHC housing applications, eviction prevention, and the Home Again Furniture Bank. Visit us or call 709-739-0290 for immediate help.',
  'services',
  10,
  true,
  '{}'::jsonb,
  now()
from public.businesses b
where b.name ilike '%Salvation Army%'
  and not exists (
    select 1 from public.ai_knowledge_items k
    where k.business_id = b.id
      and k.title = 'Homeless Services'
  );

insert into public.ai_knowledge_items (id, business_id, title, content, category, priority, is_active, metadata, created_at)
select
  gen_random_uuid(),
  b.id,
  'Food Bank & Meals',
  'Food bank available for those in need. Community meals provided. If you are hungry, struggling to afford food, or need a meal, our food bank and community meal programs are here to help. Food bank phone: 709-237-0270.',
  'services',
  9,
  true,
  '{}'::jsonb,
  now()
from public.businesses b
where b.name ilike '%Salvation Army%'
  and not exists (
    select 1 from public.ai_knowledge_items k
    where k.business_id = b.id
      and k.title = 'Food Bank & Meals'
  );
