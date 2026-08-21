-- OnePlace seed data: Salvation Army - Ches Penney Centre of Hope (St. John's, NL)
-- Researched from salvationarmy.ca, nl.211.ca, YellowPages, shopinstjohns.com


-- ============================================================
-- NEW CATEGORY: Community Services
-- ============================================================
INSERT INTO categories (id, name, slug, icon, is_active, sort_order, created_at, updated_at)
SELECT gen_random_uuid(), 'Community Services', 'community-services', 'Heart', true, 25, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'community-services');


-- ============================================================
-- SALVATION ARMY - CHES PENNEY CENTRE OF HOPE
-- ============================================================
DO $$ DECLARE b_id uuid; BEGIN
  INSERT INTO businesses (id, name, slug, description, phone, email, website_url, address_line_1, city, province, postal_code, country, latitude, longitude, timezone, status, founded_year, website_template, metadata, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Salvation Army - Ches Penney Centre of Hope',
    'salvation-army-ches-penney-centre-of-hope',
    'The Salvation Army Ches Penney Centre of Hope provides comprehensive community services in St. John''s including supportive housing, food bank, community meals, Christmas assistance, mental health counselling, harm reduction, income support, ID clinic, eviction prevention, furniture bank referrals, Narcotics Anonymous, spiritual care, and tax clinics.',
    '709-739-0290',
    'carolyn.reid-nl@salvationarmy.ca',
    'https://salvationarmy.ca/',
    '18 Springdale St',
    'St. John''s',
    'NL',
    'A1E 2R1',
    'Canada',
    47.55763,
    -52.71346,
    'America/St_Johns',
    'active',
    1886,
    'modern',
    '{"facebook": "https://www.facebook.com/SalvationArmyNL", "tags": ["community services", "food bank", "housing", "mental health", "addictions", "harm reduction", "Christmas assistance", "social services", "nonprofit"], "programs_contact": "709-739-4332", "food_bank_phone": "709-237-0270"}'::jsonb,
    now(), now()
  ) RETURNING id INTO b_id;

  INSERT INTO business_hours (id, business_id, day_of_week, opens_at, closes_at, is_closed, created_at)
  VALUES
    (gen_random_uuid(), b_id, 1, '08:00'::time, '16:00'::time, false, now()),
    (gen_random_uuid(), b_id, 2, '08:00'::time, '16:00'::time, false, now()),
    (gen_random_uuid(), b_id, 3, '08:00'::time, '16:00'::time, false, now()),
    (gen_random_uuid(), b_id, 4, '08:00'::time, '16:00'::time, false, now()),
    (gen_random_uuid(), b_id, 5, '08:00'::time, '16:00'::time, false, now()),
    (gen_random_uuid(), b_id, 0, '00:00'::time, '00:00'::time, true, now()),
    (gen_random_uuid(), b_id, 6, '00:00'::time, '00:00'::time, true, now());

  INSERT INTO business_services (id, business_id, service_id, name, description, price, currency, price_type, duration_minutes, booking_required, is_active, metadata, created_at, updated_at)
  VALUES
    (gen_random_uuid(), b_id, NULL, 'Food Bank', 'Food bank services for Metro St. John''s residents. One piece of government-issued ID required per person (MCP preferred). Contact 709-237-0270 for intake.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Supportive Housing Program', 'Semi-independent housing support. To request an application, contact Katie.adams2@salvationarmy.ca or 709-237-0269.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Mental Health Counselling', 'Counselling services available by appointment. Contact the centre to schedule.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Christmas Assistance Program', 'Christmas food hampers and children''s toy hampers for eligible families.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Income Support Drop-In', 'Drop-in assistance for income support applications and questions. Available Tue 9am-2:30pm.', NULL, 'CAD', 'quote_required', NULL, false, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'ID Clinic & Eviction Prevention', 'Social work services including ID clinic, eviction prevention, NLHC housing applications, and Home Again Furniture Bank referrals.', NULL, 'CAD', 'quote_required', NULL, false, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Tax Clinics', 'Free tax preparation assistance during tax season.', NULL, 'CAD', 'quote_required', NULL, false, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Harm Reduction Clinic', 'NL Health Services Harm Reduction team clinic. Available Tue & Thu 9am-2:30pm.', NULL, 'CAD', 'quote_required', NULL, false, true, '{}'::jsonb, now(), now());

  INSERT INTO business_categories (business_id, category_id, created_at)
  SELECT b_id, c.id, now() FROM categories c WHERE c.slug = 'community-services';

  INSERT INTO business_photos (id, business_id, url, alt_text, is_cover, sort_order, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop', 'Community support and outreach services', true, 0, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=600&fit=crop', 'Food bank and community meals', false, 1, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=600&fit=crop', 'Supportive housing program', false, 2, now());

  INSERT INTO ai_configurations (id, business_id, enabled, greeting, personality, escalation_enabled, handoff_enabled, language, model_provider, model_name, configuration, voice_enabled, preferred_language, created_at, updated_at)
  VALUES (
    gen_random_uuid(), b_id, true,
    'Welcome to the Salvation Army Ches Penney Centre of Hope! We provide food bank services, supportive housing, mental health counselling, Christmas assistance, and many other community programs. How can I help you today?',
    'Warm, compassionate, and helpful community services representative who provides clear information about available programs.',
    true, false,
    'en', 'openai', 'gpt-4o-mini',
    '{"system_prompt": "You are a helpful assistant for the Salvation Army Ches Penney Centre of Hope in St. John''s, NL. You provide information about: food bank (709-237-0270), supportive housing program, mental health counselling, Christmas assistance (food hampers and toy hampers), harm reduction clinic (Tue/Thu 9am-2:30pm), income support drop-in (Tue 9am-2:30pm), ID clinic, eviction prevention, NLHC applications, furniture bank referrals, Narcotics Anonymous, spiritual care, and tax clinics. Centre hours: Mon-Fri 8am-4pm. Phone: 709-739-0290. You are compassionate, warm, and helpful. For eligibility questions, direct people to visit in person or call."}'::jsonb,
    false, 'en', now(), now()
  );

  INSERT INTO ai_knowledge_items (id, business_id, title, content, category, is_active, metadata, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'Programs & Services', 'The Ches Penney Centre of Hope offers: Christmas Assistance (food and toy hampers), Harm Reduction Clinic (NL Health Services), Income Support Drop-In, Mental Health Counsellor, Narcotics Anonymous, Social Worker (ID clinic, eviction prevention, NLHC applications, Home Again Furniture Bank referrals), Spiritual Care, Supportive Housing Program, and Tax Clinics.', 'services', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Food Bank & Community Meals', 'Food bank serves Metro St. John''s residents. Requirements: one piece of government-issued ID per person (MCP preferred). Food bank intake: 709-237-0270. Coordinator: 709-237-0095. Also provides hot meals and Salvation Army Thrift Store clothing vouchers.', 'services', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Hours & Special Clinic Times', 'Centre hours: Monday-Friday 8am-4pm. Harm Reduction Clinic: Tuesday & Thursday 9am-2:30pm. Income Support Drop-In: Tuesday 9am-2:30pm. Saturday and Sunday closed.', 'hours', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'About the Salvation Army', 'The Salvation Army has served Newfoundland since 1886, when the first corps was established on Springdale Street in St. John''s. With over 30,000 adherents in the province, it is the Canadian province with the highest percentage of Salvation Army membership. The organization provides spiritual care, community services, and social programs across the province.', 'about', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Contact Information', 'Phone: 709-739-0290. Fax: 709-808-0267. Food bank: 709-237-0270. Director of Programs: Carolyn Reid, 709-739-4332, carolyn.reid-nl@salvationarmy.ca. Executive Director: Major Steven Barrett, 709-237-0225, steven.barrett@salvationarmy.ca. Website: salvationarmy.ca. Address: 18 Springdale St, St. John''s, NL, A1E 2R1.', 'contact', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Supportive Housing', 'The Supportive Housing Program provides semi-independent housing support. To request an application, contact Katie.adams2@salvationarmy.ca or 709-237-0269.', 'services', true, '{}'::jsonb, now());

END $$;
