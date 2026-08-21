SELECT 'businesses' as tbl, count(*) as cnt from public.businesses
UNION ALL SELECT 'categories', count(*) from public.categories
UNION ALL SELECT 'biz_categories', count(*) from public.business_categories
UNION ALL SELECT 'services', count(*) from public.business_services
UNION ALL SELECT 'hours', count(*) from public.business_hours
UNION ALL SELECT 'ai_configs', count(*) from public.ai_configurations
UNION ALL SELECT 'knowledge', count(*) from public.ai_knowledge_items
UNION ALL SELECT 'photos', count(*) from public.business_photos;