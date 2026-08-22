-- Enrich Salvation Army knowledge base with terms people actually search for.
-- "Supportive housing" is the official term, but people search "shelter",
-- "homeless", "accommodation", "emergency housing". Add knowledge items
-- that contain these natural-language terms so FTS and vector search
-- can find this business for urgent community-service queries.

insert into public.ai_knowledge_items (business_id, topic, content, source, priority, is_active, metadata, created_at, updated_at)
select
  b.id,
  'Emergency Shelter & Housing',
  'The Salvation Army provides emergency shelter and supportive housing for people experiencing homelessness. If you need a place to stay, accommodation, or are sleeping rough, we can help with immediate shelter and long-term housing support.',
  'manual',
  10,
  true,
  '{}'::jsonb,
  now(),
  now()
from public.businesses b
where b.name ilike '%Salvation Army%'
  and not exists (
    select 1 from public.ai_knowledge_items k
    where k.business_id = b.id
      and k.topic = 'Emergency Shelter & Housing'
  );

insert into public.ai_knowledge_items (business_id, topic, content, source, priority, is_active, metadata, created_at, updated_at)
select
  b.id,
  'Homeless Services',
  'For individuals who are homeless or at risk of homelessness: we offer emergency accommodation, supportive housing applications, NLHC housing applications, eviction prevention, and the Home Again Furniture Bank. Visit us or call 709-739-0290 for immediate help.',
  'manual',
  10,
  true,
  '{}'::jsonb,
  now(),
  now()
from public.businesses b
where b.name ilike '%Salvation Army%'
  and not exists (
    select 1 from public.ai_knowledge_items k
    where k.business_id = b.id
      and k.topic = 'Homeless Services'
  );

insert into public.ai_knowledge_items (business_id, topic, content, source, priority, is_active, metadata, created_at, updated_at)
select
  b.id,
  'Food Bank & Meals',
  'Food bank available for those in need. Community meals provided. If you are hungry, struggling to afford food, or need a meal, our food bank and community meal programs are here to help. Food bank phone: 709-237-0270.',
  'manual',
  9,
  true,
  '{}'::jsonb,
  now(),
  now()
from public.businesses b
where b.name ilike '%Salvation Army%'
  and not exists (
    select 1 from public.ai_knowledge_items k
    where k.business_id = b.id
      and k.topic = 'Food Bank & Meals'
  );
