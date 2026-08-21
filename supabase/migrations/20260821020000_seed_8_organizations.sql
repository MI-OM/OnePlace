-- OnePlace seed data: 8 St. John's organizations (researched from web)
-- Separate from the 28 NL businesses.


-- ============================================================
-- NEW CATEGORIES
-- ============================================================
INSERT INTO categories (id, name, slug, icon, is_active, sort_order, created_at, updated_at)
SELECT gen_random_uuid(), 'Coaching', 'coaching', 'Target', true, 20, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'coaching');

INSERT INTO categories (id, name, slug, icon, is_active, sort_order, created_at, updated_at)
SELECT gen_random_uuid(), 'Publishing', 'publishing', 'BookOpen', true, 21, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'publishing');

INSERT INTO categories (id, name, slug, icon, is_active, sort_order, created_at, updated_at)
SELECT gen_random_uuid(), 'Church & Faith', 'church', 'Church', true, 22, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'church');

INSERT INTO categories (id, name, slug, icon, is_active, sort_order, created_at, updated_at)
SELECT gen_random_uuid(), 'Career Services', 'career-services', 'Briefcase', true, 23, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'career-services');

INSERT INTO categories (id, name, slug, icon, is_active, sort_order, created_at, updated_at)
SELECT gen_random_uuid(), 'Technology & Innovation', 'technology', 'Cpu', true, 24, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'technology');


-- ============================================================
-- 1. OA DYNASTY GROUP
-- ============================================================
DO $$ DECLARE b_id uuid; BEGIN
  INSERT INTO businesses (id, name, slug, description, phone, email, website_url, address_line_1, city, province, postal_code, country, latitude, longitude, timezone, status, founded_year, website_template, metadata, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'OA Dynasty Group',
    'oa-dynasty-group',
    'The OA-Dynasty Group Inc. is a publishing, media, and education enterprise producing books, journals, courses, media content, and counselling services. They specialize in marriage coaching, relationship counseling, pre-marital preparation, and faith-based community programs for individuals, couples, and families.',
    '709-722-8899',
    'info@oadynasty.com',
    'https://oadynasty.com/',
    NULL,
    'St. John''s',
    'NL',
    NULL,
    'Canada',
    47.5615,
    -52.7126,
    'America/St_Johns',
    'active',
    NULL,
    'modern',
    '{"facebook": "https://www.facebook.com/OA-Dynasty-Forum-103605569017113", "twitter": "https://twitter.com/oa_dynasty", "instagram": "https://www.instagram.com/oa_dynasty/", "youtube": "http://youtube.com/@marriagewithbliss", "tags": ["marriage coaching", "publishing", "counseling", "books", "courses", "faith-based", "relationships", "pre-marital", "family"]}'::jsonb,
    now(), now()
  ) RETURNING id INTO b_id;

  INSERT INTO business_hours (id, business_id, day_of_week, opens_at, closes_at, is_closed, created_at)
  VALUES
    (gen_random_uuid(), b_id, 0, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 1, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 2, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 3, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 4, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 5, '09:00'::time, '17:00'::time, true, now()),
    (gen_random_uuid(), b_id, 6, '09:00'::time, '17:00'::time, true, now());

  INSERT INTO business_services (id, business_id, service_id, name, description, price, currency, price_type, duration_minutes, booking_required, is_active, metadata, created_at, updated_at)
  VALUES
    (gen_random_uuid(), b_id, NULL, 'Relationship Clarity Session', 'One-on-one session for singles and engaged clients to gain clarity on relationship challenges.', 150.00, 'CAD', 'starting_from', 60, true, true, '{"format": "in-person or virtual"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Marriage Assessment', 'Structured assessment evaluating communication patterns, emotional intimacy, and conflict resolution styles, with a personalized written report.', 200.00, 'CAD', 'starting_from', 60, true, true, '{"format": "in-person or virtual"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Pre-Marital Coaching Classes', '10-module programme over 3 months covering values, vision, finances, family, faith, and conflict resolution.', 800.00, 'CAD', 'starting_from', 60, true, true, '{"format": "10 sessions over 3 months", "modules": 10}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Restorative Coaching', '6-session programme for couples navigating deeper wounds such as betrayal, prolonged conflict, emotional distance, and trust breakdown.', 1200.00, 'CAD', 'starting_from', 60, true, true, '{"format": "6 sessions x 60 minutes"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Corporate Training', 'Half-day or full-day workshops for organizations on work-life integration, communication, conflict resolution, and emotional intelligence.', NULL, 'CAD', 'quote_required', NULL, true, true, '{"format": "workshop"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Book Publishing Consultation', 'Step-by-step guidance through the publishing journey, from manuscript to published book.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now());

  INSERT INTO business_categories (business_id, category_id, created_at)
  SELECT b_id, c.id, now() FROM categories c WHERE c.slug IN ('coaching', 'publishing');

  INSERT INTO business_photos (id, business_id, url, alt_text, is_cover, sort_order, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=600&fit=crop', 'Marriage coaching session', true, 0, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop', 'Family and relationship support', false, 1, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=600&fit=crop', 'Published books and reading materials', false, 2, now());

  INSERT INTO ai_configurations (id, business_id, enabled, greeting, personality, escalation_enabled, handoff_enabled, language, model_provider, model_name, configuration, voice_enabled, preferred_language, created_at, updated_at)
  VALUES (
    gen_random_uuid(), b_id, true,
    'Welcome to OA Dynasty Group! We help individuals, couples, and families thrive through coaching, books, and courses. How can I help you today?',
    'Warm, supportive relationship coach who is faith-friendly, inclusive, and encouraging.',
    true, false,
    'en', 'openai', 'gpt-4o-mini',
    '{"system_prompt": "You are a helpful assistant for OA Dynasty Group, a marriage coaching and publishing enterprise in St. John''s, NL. You help with information about coaching services (relationship clarity, marriage assessment, pre-marital coaching, restorative coaching), corporate training, book publishing consultations, books, and courses. You are warm, supportive, and faith-friendly while being inclusive.", "greeting": "Welcome to OA Dynasty Group! We help individuals, couples, and families thrive through coaching, books, and courses. How can I help you today?"}'::jsonb,
    false, 'en', now(), now()
  );

  INSERT INTO ai_knowledge_items (id, business_id, title, content, category, is_active, metadata, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'Coaching Programs', 'OA Dynasty Group offers five coaching packages: Relationship Clarity (single 60-minute session for singles and engaged clients), Marriage Assessment (structured evaluation with written report), Pre-Marital Coaching Classes (10 modules over 3 months), Restorative Coaching (6 sessions for couples navigating deeper wounds), and Corporate Training workshops for organizations.', 'services', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'About the Founders', 'Founded by Dr. Anthony Akerele (scientist and published author) and Dr. Tolulope Akerele (scholar and planning professional). Both are trained marriage coaches and published authors who co-host the Cleave to Bliss Podcast.', 'about', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Contact & Who They Serve', 'Phone 709-722-8899, email info@oadynasty.com. OA Dynasty Group serves individuals stepping into purpose, couples building lasting marriages, and families raising the next generation. Faith-rooted but welcoming to everyone regardless of background.', 'contact', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Booking Policy', '48+ hours notice for free cancellation; 24-48 hours notice carries a 50% fee; under 24 hours is charged in full. Payment is required at booking and all sessions are strictly confidential. An intake form is required before the first session.', 'policies', true, '{}'::jsonb, now());

END $$;

-- ============================================================
-- 2. CMFI NL
-- ============================================================
DO $$ DECLARE b_id uuid; BEGIN
  INSERT INTO businesses (id, name, slug, description, phone, email, website_url, address_line_1, city, province, postal_code, country, latitude, longitude, timezone, status, founded_year, website_template, metadata, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'CMFI NL',
    'cmfi-nl',
    'Christian Missionary Fellowship International Newfoundland is a non-denominational church in St. John''s offering Sunday services (9 AM and 12 PM, with French translation at noon), Wednesday Bible study, house churches, couples retreats, premarital counseling, and community outreach. An authentic family where you are taught God''s Word, encouraged in spiritual growth, and empowered to serve.',
    '(709) 700-7019',
    'info@cmfinl.org',
    'https://cmfinl.org/',
    '40 International Place',
    'St. John''s',
    'NL',
    'A1A 0R6',
    'Canada',
    47.566,
    -52.743,
    'America/St_Johns',
    'active',
    NULL,
    'classic',
    '{"facebook": "https://www.facebook.com/cmfinl", "instagram": "https://www.instagram.com/cmfinl/", "twitter": "https://twitter.com/cmfinl", "youtube": "https://www.youtube.com/@CMFINL", "tags": ["church", "non-denominational", "worship", "bible study", "prayer", "couples retreat", "premarital counseling", "french service", "community"]}'::jsonb,
    now(), now()
  ) RETURNING id INTO b_id;

  INSERT INTO business_hours (id, business_id, day_of_week, opens_at, closes_at, is_closed, created_at)
  VALUES
    (gen_random_uuid(), b_id, 0, '09:00'::time, '17:00'::time, true, now()),
    (gen_random_uuid(), b_id, 1, '09:00'::time, '17:00'::time, true, now()),
    (gen_random_uuid(), b_id, 2, '18:00'::time, '20:30'::time, false, now()),
    (gen_random_uuid(), b_id, 3, '09:00'::time, '17:00'::time, true, now()),
    (gen_random_uuid(), b_id, 4, '09:00'::time, '17:00'::time, true, now()),
    (gen_random_uuid(), b_id, 5, '09:00'::time, '14:00'::time, true, now()),
    (gen_random_uuid(), b_id, 6, '09:00'::time, '14:00'::time, false, now());

  INSERT INTO business_services (id, business_id, service_id, name, description, price, currency, price_type, duration_minutes, booking_required, is_active, metadata, created_at, updated_at)
  VALUES
    (gen_random_uuid(), b_id, NULL, 'Sunday AM Service', 'First service of the day with Spirit-filled worship and teaching.', 0.00, 'CAD', 'fixed', 120, true, true, '{"time": "9:00 AM"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Sunday Noon Service', 'Second service with French translation available.', 0.00, 'CAD', 'fixed', 120, true, true, '{"time": "12:00 PM", "languages": ["English", "French"]}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Wednesday Bible Study', 'Midweek Bible study and teaching. Pre-service prayers start at 6 PM.', 0.00, 'CAD', 'fixed', 120, true, true, '{"time": "7:00 PM", "pre_service": "6:00 PM"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Couples Retreat', 'Faith-based retreat helping married couples strengthen their relationship.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Premarital Counseling', 'Structured preparation for engaged or seriously dating couples.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'House Churches', 'Small-group gatherings across the city for deeper community and spiritual growth.', 0.00, 'CAD', 'fixed', 90, true, true, '{}'::jsonb, now(), now());

  INSERT INTO business_categories (business_id, category_id, created_at)
  SELECT b_id, c.id, now() FROM categories c WHERE c.slug IN ('church', 'non-profit');

  INSERT INTO business_photos (id, business_id, url, alt_text, is_cover, sort_order, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&h=600&fit=crop', 'Sunday worship service', true, 0, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&h=600&fit=crop', 'Congregation gathered in fellowship', false, 1, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1473177104440-ffee2f376098?w=800&h=600&fit=crop', 'Worship night atmosphere', false, 2, now());

  INSERT INTO ai_configurations (id, business_id, enabled, greeting, personality, escalation_enabled, handoff_enabled, language, model_provider, model_name, configuration, voice_enabled, preferred_language, created_at, updated_at)
  VALUES (
    gen_random_uuid(), b_id, true,
    'Welcome to CMFI NL! We are a non-denominational church family in St. John''s. How can I help you today?',
    'Warm, welcoming church host who is faith-centered and community-minded.',
    true, false,
    'en', 'openai', 'gpt-4o-mini',
    '{"system_prompt": "You are a helpful assistant for CMFI NL (Christian Missionary Fellowship International Newfoundland), a non-denominational church in St. John''s, NL. You provide information about service times, Wednesday Bible study, house churches, couples retreats, premarital counseling, and community outreach. You are warm, welcoming, and faith-centered.", "greeting": "Welcome to CMFI NL! We are a non-denominational church family in St. John''s. How can I help you today?"}'::jsonb,
    false, 'en', now(), now()
  );

  INSERT INTO ai_knowledge_items (id, business_id, title, content, category, is_active, metadata, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'Service Times', 'Sunday AM Service at 9:00 AM, Sunday Noon Service at 12:00 PM (with French translation), and Wednesday Bible Study at 7:00 PM with pre-service prayers at 6:00 PM.', 'services', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Location & Contact', 'Located at 40 International Place, St. John''s, NL A1A 0R6. Phone (709) 700-7019, email info@cmfinl.org.', 'contact', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Ministries & Programs', 'Beyond weekly services, CMFI NL runs house churches, an annual couples retreat, premarital counseling, children''s programs, and community outreach initiatives.', 'services', true, '{}'::jsonb, now());

END $$;

-- ============================================================
-- 3. ININ
-- ============================================================
DO $$ DECLARE b_id uuid; BEGIN
  INSERT INTO businesses (id, name, slug, description, phone, email, website_url, address_line_1, city, province, postal_code, country, latitude, longitude, timezone, status, founded_year, website_template, metadata, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'ININ',
    'inin',
    'Insight Nexus Integration Network (ININ) Inc. is a Black-led, immigrant-focused non-profit supporting integration through research, empowerment, and community services. ININ advances the socio-cultural and economic integration and participation of Black and immigrant communities, starting in Newfoundland and Labrador.',
    NULL,
    NULL,
    'https://ininetwork.ca/',
    NULL,
    'St. John''s',
    'NL',
    NULL,
    'Canada',
    47.5615,
    -52.7126,
    'America/St_Johns',
    'active',
    2024,
    'minimal',
    '{"linkedin": "https://www.linkedin.com/company/ininetwork", "instagram": "https://www.instagram.com/ininetwork_ca", "tags": ["non-profit", "immigration", "integration", "research", "empowerment", "Black-led", "community services", "immigrants", "Newfoundland"]}'::jsonb,
    now(), now()
  ) RETURNING id INTO b_id;

  INSERT INTO business_hours (id, business_id, day_of_week, opens_at, closes_at, is_closed, created_at)
  VALUES
    (gen_random_uuid(), b_id, 0, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 1, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 2, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 3, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 4, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 5, '09:00'::time, '17:00'::time, true, now()),
    (gen_random_uuid(), b_id, 6, '09:00'::time, '17:00'::time, true, now());

  INSERT INTO business_services (id, business_id, service_id, name, description, price, currency, price_type, duration_minutes, booking_required, is_active, metadata, created_at, updated_at)
  VALUES
    (gen_random_uuid(), b_id, NULL, 'Community Integration Programs', 'Programs designed to support the socio-cultural and economic integration of immigrants in Newfoundland and Labrador.', 0.00, 'CAD', 'fixed', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Research & Advocacy', 'Evidence-based research on immigrant experiences and integration outcomes, paired with advocacy.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Empowerment Workshops', 'Practical workshops that strengthen individuals and families.', 0.00, 'CAD', 'fixed', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Community Surveys', 'Participatory surveys to understand and address immigrant community needs.', 0.00, 'CAD', 'fixed', NULL, true, true, '{}'::jsonb, now(), now());

  INSERT INTO business_categories (business_id, category_id, created_at)
  SELECT b_id, c.id, now() FROM categories c WHERE c.slug IN ('non-profit');

  INSERT INTO business_photos (id, business_id, url, alt_text, is_cover, sort_order, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop', 'Volunteers supporting newcomer communities', true, 0, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop', 'Diverse community group', false, 1, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop', 'Community workshop discussion', false, 2, now());

  INSERT INTO ai_configurations (id, business_id, enabled, greeting, personality, escalation_enabled, handoff_enabled, language, model_provider, model_name, configuration, voice_enabled, preferred_language, created_at, updated_at)
  VALUES (
    gen_random_uuid(), b_id, true,
    'Welcome to ININ! We support the integration of Black and immigrant communities through research, empowerment, and community services. How can I help you?',
    'Inclusive, encouraging community advocate who is evidence-driven.',
    true, false,
    'en', 'openai', 'gpt-4o-mini',
    '{"system_prompt": "You are a helpful assistant for ININ (Insight Nexus Integration Network), a Black-led, immigrant-focused non-profit in St. John''s, NL. You help with information about community integration programs, research and advocacy, empowerment workshops, community surveys, and how to get involved or partner. You are inclusive, supportive, and evidence-driven.", "greeting": "Welcome to ININ! We support the integration of Black and immigrant communities through research, empowerment, and community services. How can I help you?"}'::jsonb,
    false, 'en', now(), now()
  );

  INSERT INTO ai_knowledge_items (id, business_id, title, content, category, is_active, metadata, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'About ININ', 'ININ is a Black-led, immigrant-focused non-profit founded in 2024 and based in St. John''s, NL. Its mission is to support integration through research and empowerment services that strengthen individuals and families and build thriving communities across Newfoundland and Labrador.', 'about', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Programs & Services', 'ININ offers community integration programs, research and advocacy, empowerment workshops, and community surveys. Community programs are offered free of charge.', 'services', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Get Involved', 'ININ collaborates with volunteers, researchers, community organizations, and settlement partners. Reach out through ininetwork.ca or LinkedIn to participate in surveys, workshops, or partnerships.', 'faq', true, '{}'::jsonb, now());

END $$;

-- ============================================================
-- 4. DIKAN TECH CORPORATION
-- ============================================================
DO $$ DECLARE b_id uuid; BEGIN
  INSERT INTO businesses (id, name, slug, description, phone, email, website_url, address_line_1, city, province, postal_code, country, latitude, longitude, timezone, status, founded_year, website_template, metadata, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Dikan Tech Corporation',
    'dikan-tech-corporation',
    'Dikan Tech Corporation is a non-profit, Black-owned technology education and consulting company equipping individuals — especially immigrants, underrepresented minorities, career transitioners, and students — with critical digital skills through coding workshops, career transition programs, and customized curricula.',
    '+1 709 219 2999',
    'info@dikantech.ca',
    'https://dikantech.ca/',
    '76 Halls Road',
    'St. John''s',
    'NL',
    'A1A 5Y8',
    'Canada',
    47.58,
    -52.75,
    'America/St_Johns',
    'active',
    2024,
    'modern',
    '{"linkedin": "https://www.linkedin.com/company/dikan-tech-corp/", "instagram": "https://www.instagram.com/dikantech/", "youtube": "https://youtube.com/@dikantechcorp", "tags": ["non-profit", "technology", "education", "coding", "digital skills", "mentorship", "career transition", "Black-owned", "immigrants", "seniors"]}'::jsonb,
    now(), now()
  ) RETURNING id INTO b_id;

  INSERT INTO business_hours (id, business_id, day_of_week, opens_at, closes_at, is_closed, created_at)
  VALUES
    (gen_random_uuid(), b_id, 0, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 1, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 2, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 3, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 4, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 5, '09:00'::time, '17:00'::time, true, now()),
    (gen_random_uuid(), b_id, 6, '09:00'::time, '17:00'::time, true, now());

  INSERT INTO business_services (id, business_id, service_id, name, description, price, currency, price_type, duration_minutes, booking_required, is_active, metadata, created_at, updated_at)
  VALUES
    (gen_random_uuid(), b_id, NULL, 'Mentorship Over Coffee', 'Small-group mentorship connecting participants directly with industry professionals.', 0.00, 'CAD', 'fixed', NULL, true, true, '{"format": "small-group mentorship"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Beyond the Degree', 'Career-focused program helping students and recent graduates transition from education into the tech workforce.', 0.00, 'CAD', 'fixed', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Talk Tech to Me', 'Interactive workshop and panel-style event that breaks down the tech industry for newcomers.', 0.00, 'CAD', 'fixed', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Digital Makers Lab', 'Hands-on learning lab where participants build practical tech skills through real projects.', 0.00, 'CAD', 'fixed', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Safety Today for Seniors', 'Community program helping seniors confidently and safely navigate today''s digital world.', 0.00, 'CAD', 'fixed', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Project Collective Work Term', '52-week team-based work term providing real-world experience on tech projects.', 0.00, 'CAD', 'fixed', NULL, true, true, '{"duration": "52 weeks"}'::jsonb, now(), now());

  INSERT INTO business_categories (business_id, category_id, created_at)
  SELECT b_id, c.id, now() FROM categories c WHERE c.slug IN ('non-profit', 'technology');

  INSERT INTO business_photos (id, business_id, url, alt_text, is_cover, sort_order, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop', 'Coding on a laptop', true, 0, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop', 'Mentor guiding a learner', false, 1, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop', 'Team collaborating on a tech project', false, 2, now());

  INSERT INTO ai_configurations (id, business_id, enabled, greeting, personality, escalation_enabled, handoff_enabled, language, model_provider, model_name, configuration, voice_enabled, preferred_language, created_at, updated_at)
  VALUES (
    gen_random_uuid(), b_id, true,
    'Welcome to Dikan Tech! We help people build real tech skills through free mentorship, workshops, and hands-on programs. How can I help you?',
    'Encouraging, practical tech educator who believes anyone can learn digital skills.',
    true, false,
    'en', 'openai', 'gpt-4o-mini',
    '{"system_prompt": "You are a helpful assistant for Dikan Tech Corporation, a non-profit tech education company in St. John''s, NL. You help with information about their free programs (Mentorship Over Coffee, Beyond the Degree, Talk Tech to Me, Digital Makers Lab, Safety Today for Seniors, Project Collective Work Term), how to join, and partnership opportunities. You are encouraging, practical, and inclusive.", "greeting": "Welcome to Dikan Tech! We help people build real tech skills through free mentorship, workshops, and hands-on programs. How can I help you?"}'::jsonb,
    false, 'en', now(), now()
  );

  INSERT INTO ai_knowledge_items (id, business_id, title, content, category, is_active, metadata, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'Programs Overview', 'Dikan Tech offers six free programs: Mentorship Over Coffee (small-group mentorship with industry professionals), Beyond the Degree (career transition for students and grads), Talk Tech to Me (interactive panels), Digital Makers Lab (hands-on tech skills), Safety Today for Seniors (digital literacy for seniors), and Project Collective (52-week team work term).', 'services', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'About & Contact', 'Founded by Gillian Ogyiri and incorporated in 2024. Located at 76 Halls Road, St. John''s, NL A1A 5Y8. Phone +1 709 219 2999, email info@dikantech.ca.', 'about', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Who We Serve', 'Programs are designed for immigrants, underrepresented minorities, career transitioners, students, and seniors. No prior tech experience is needed for most programs.', 'faq', true, '{}'::jsonb, now());

END $$;

-- ============================================================
-- 5. VERISULT
-- ============================================================
DO $$ DECLARE b_id uuid; BEGIN
  INSERT INTO businesses (id, name, slug, description, phone, email, website_url, address_line_1, city, province, postal_code, country, latitude, longitude, timezone, status, founded_year, website_template, metadata, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Verisult',
    'verisult',
    'Verisult is an EdTech company addressing the global talent shortage by helping individuals and organizations build skills and talent pipelines. Through Verisult College (career accelerator programs), Verisult Talent (recruitment and workforce development), and SkillMatch AI, they deliver training, work-integrated learning, mentorship, and AI-powered job matching.',
    NULL,
    'info@verisult.com',
    'https://verisult.com/',
    NULL,
    'St. John''s',
    'NL',
    NULL,
    'Canada',
    47.5615,
    -52.7126,
    'America/St_Johns',
    'active',
    NULL,
    'modern',
    '{"facebook": "https://www.facebook.com/Verisult", "linkedin": "https://www.linkedin.com/company/verisult-inc/", "instagram": "https://www.instagram.com/verisult_inc/", "youtube": "https://www.youtube.com/@verisult", "tags": ["career services", "EdTech", "career accelerator", "project management", "business analysis", "product management", "recruitment", "training", "mentorship", "job placement", "PMP"]}'::jsonb,
    now(), now()
  ) RETURNING id INTO b_id;

  INSERT INTO business_hours (id, business_id, day_of_week, opens_at, closes_at, is_closed, created_at)
  VALUES
    (gen_random_uuid(), b_id, 0, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 1, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 2, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 3, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 4, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 5, '09:00'::time, '17:00'::time, true, now()),
    (gen_random_uuid(), b_id, 6, '09:00'::time, '17:00'::time, true, now());

  INSERT INTO business_services (id, business_id, service_id, name, description, price, currency, price_type, duration_minutes, booking_required, is_active, metadata, created_at, updated_at)
  VALUES
    (gen_random_uuid(), b_id, NULL, 'Career Accelerator Program (CAP)', '12-week mentor-led career accelerator with portfolio building, mock interviews, and job search support until placement. Pathways: Business Analysis, Product Management, Project Management.', 1750.00, 'CAD', 'fixed', NULL, true, true, '{"duration": "12 weeks", "placement_rate": "70%+", "pathways": ["Business Analysis", "Product Management", "Project Management"]}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'PMP Group Coaching', 'Group coaching for PMP certification preparation led by experienced project managers.', NULL, 'CAD', 'starting_from', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Thrive Tribe Free Community', 'Free community for professionals focused on job searching, upskilling, and thought leadership.', 0.00, 'CAD', 'fixed', NULL, true, true, '{"members": "3000+"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Recruitment Services', 'Inclusive recruitment and workforce development strategies for employers.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Corporate Training', 'Customized training programs that upskill teams and organizations.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Get Hired Bootcamp', 'Intensive bootcamp covering resume, LinkedIn, interview prep, and a fast job-search sprint.', 500.00, 'CAD', 'starting_from', NULL, true, true, '{"duration": "1 week"}'::jsonb, now(), now());

  INSERT INTO business_categories (business_id, category_id, created_at)
  SELECT b_id, c.id, now() FROM categories c WHERE c.slug IN ('career-services');

  INSERT INTO business_photos (id, business_id, url, alt_text, is_cover, sort_order, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=600&fit=crop', 'Professionals celebrating a career milestone', true, 0, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop', 'Career strategy planning session', false, 1, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop', 'One-on-one career coaching', false, 2, now());

  INSERT INTO ai_configurations (id, business_id, enabled, greeting, personality, escalation_enabled, handoff_enabled, language, model_provider, model_name, configuration, voice_enabled, preferred_language, created_at, updated_at)
  VALUES (
    gen_random_uuid(), b_id, true,
    'Welcome to Verisult! We help professionals build meaningful careers and organizations find skilled talent. How can I help you today?',
    'Professional, results-oriented career strategist.',
    true, false,
    'en', 'openai', 'gpt-4o-mini',
    '{"system_prompt": "You are a helpful assistant for Verisult, an EdTech career services company in St. John''s, NL. You help with information about the Career Accelerator Program (CAP), PMP group coaching, the Thrive Tribe free community, recruitment services, corporate training, and the Get Hired Bootcamp. You are professional, results-oriented, and supportive.", "greeting": "Welcome to Verisult! We help professionals build meaningful careers and organizations find skilled talent. How can I help you today?"}'::jsonb,
    false, 'en', now(), now()
  );

  INSERT INTO ai_knowledge_items (id, business_id, title, content, category, is_active, metadata, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'Career Accelerator Program', 'CAP is a 12-week mentor-led program with a 70%+ placement rate. Three pathways: Business Analysis, Product Management, and Project Management. Includes live projects, 1:1 mentorship, portfolio building, resume and LinkedIn overhaul, mock interviews, and job placement support. Investment: C$1,750.', 'services', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'About Verisult', 'Founded by Ogaga Johnson, PMP. Verisult has trained thousands of professionals across multiple countries through three divisions: Verisult College (training), Verisult Talent (recruitment), and SkillMatch AI (job-matching product). Email info@verisult.com.', 'about', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Who CAP Is For', 'Designed for career shifters, career starters, career relaunchers, and experienced newcomers to Canada who want Canadian experience and faster placement.', 'faq', true, '{}'::jsonb, now());

END $$;

-- ============================================================
-- 6. VEZIBILITY
-- ============================================================
DO $$ DECLARE b_id uuid; BEGIN
  INSERT INTO businesses (id, name, slug, description, phone, email, website_url, address_line_1, city, province, postal_code, country, latitude, longitude, timezone, status, founded_year, website_template, metadata, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Vezibility',
    'vezibility',
    'Vezibility helps brands, creatives, and entrepreneurs cut through the noise with clarity-driven visibility strategies. Offerings include clarity sessions, the Visibility Vault template library, done-with-you support, and email marketing setup — all designed for sustainable growth without burnout.',
    NULL,
    NULL,
    'https://www.vezibility.com/',
    NULL,
    'St. John''s',
    'NL',
    NULL,
    'Canada',
    47.5615,
    -52.7126,
    'America/St_Johns',
    'active',
    NULL,
    'minimal',
    '{"facebook": "https://web.facebook.com/Vezibility/", "instagram": "https://www.instagram.com/vezibility/", "linkedin": "https://www.linkedin.com/company/vezibility/", "tags": ["coaching", "visibility", "marketing", "branding", "content strategy", "personal branding", "email marketing"]}'::jsonb,
    now(), now()
  ) RETURNING id INTO b_id;

  INSERT INTO business_hours (id, business_id, day_of_week, opens_at, closes_at, is_closed, created_at)
  VALUES
    (gen_random_uuid(), b_id, 0, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 1, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 2, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 3, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 4, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 5, '09:00'::time, '17:00'::time, true, now()),
    (gen_random_uuid(), b_id, 6, '09:00'::time, '17:00'::time, true, now());

  INSERT INTO business_services (id, business_id, service_id, name, description, price, currency, price_type, duration_minutes, booking_required, is_active, metadata, created_at, updated_at)
  VALUES
    (gen_random_uuid(), b_id, NULL, 'Clarity Session', '60-minute session to audit your online presence, fix bio and positioning, map your client journey, and leave with a tailored action plan.', 150.00, 'CAD', 'starting_from', 60, true, true, '{"includes": ["Online presence audit", "Bio & positioning fix", "Client journey mapping", "Tailored action steps"]}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Visibility Vault', 'One-time purchase digital library: 100+ carousel templates across 20+ content categories, fully customizable, with quarterly updates.', 59.00, 'CAD', 'fixed', NULL, true, true, '{"type": "digital product", "access": "lifetime"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Done-With-You Support', 'Quarterly ongoing support with monthly strategy sessions, content review, performance analysis, and direct access to the team.', 500.00, 'CAD', 'starting_from', NULL, true, true, '{"cadence": "quarterly"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Email Marketing Setup', 'One-time setup of your email system: sequences, list building, welcome series, and funnel optimization.', 800.00, 'CAD', 'starting_from', NULL, true, true, '{"type": "one-time setup"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Free Visibility Audit', 'Take the Visibility Scorecard for a quick snapshot of your brand visibility and what to fix first.', 0.00, 'CAD', 'fixed', NULL, true, true, '{"type": "free resource", "url": "https://www.vezibility.com/scorecard"}'::jsonb, now(), now());

  INSERT INTO business_categories (business_id, category_id, created_at)
  SELECT b_id, c.id, now() FROM categories c WHERE c.slug IN ('coaching');

  INSERT INTO business_photos (id, business_id, url, alt_text, is_cover, sort_order, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=600&fit=crop', 'Social media marketing planning', true, 0, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800&h=600&fit=crop', 'Content creation workspace', false, 1, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop', 'Entrepreneur working on a laptop', false, 2, now());

  INSERT INTO ai_configurations (id, business_id, enabled, greeting, personality, escalation_enabled, handoff_enabled, language, model_provider, model_name, configuration, voice_enabled, preferred_language, created_at, updated_at)
  VALUES (
    gen_random_uuid(), b_id, true,
    'Hey! Welcome to Vezibility. We help you get seen, get trusted, and grow — without the burnout. What can I help you with?',
    'Energetic, encouraging visibility coach who keeps things practical.',
    true, false,
    'en', 'openai', 'gpt-4o-mini',
    '{"system_prompt": "You are a helpful assistant for Vezibility, a visibility marketing coaching business in St. John''s, NL. You help with information about clarity sessions, the Visibility Vault template library, done-with-you support, email marketing setup, and the free visibility scorecard. You are energetic, encouraging, and practical.", "greeting": "Hey! Welcome to Vezibility. We help you get seen, get trusted, and grow — without the burnout. What can I help you with?"}'::jsonb,
    false, 'en', now(), now()
  );

  INSERT INTO ai_knowledge_items (id, business_id, title, content, category, is_active, metadata, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'Services Overview', 'Vezibility offers: Clarity Session (60-minute audit and action plan, from $150), Visibility Vault ($59 template library), Done-With-You Support (quarterly, from $500), Email Marketing Setup (one-time, from $800), and a free Visibility Scorecard audit.', 'services', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Approach', 'Vezibility focuses on sustainable growth without burnout: audit your visibility, create a strategy, implement with support, and optimize based on results. Over 1,500 people have used their frameworks to show up consistently online.', 'about', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Connect Online', 'Follow Vezibility on Instagram @vezibility, Facebook /Vezibility, and LinkedIn, or visit vezibility.com to take the free Visibility Scorecard.', 'contact', true, '{}'::jsonb, now());

END $$;

-- ============================================================
-- 7. SENIORSNL
-- ============================================================
DO $$ DECLARE b_id uuid; BEGIN
  INSERT INTO businesses (id, name, slug, description, phone, email, website_url, address_line_1, city, province, postal_code, country, latitude, longitude, timezone, status, founded_year, website_template, metadata, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'SeniorsNL',
    'seniors-nl',
    'SeniorsNL is a non-profit charitable organization supporting people aged 50 and older across Newfoundland and Labrador. They offer trusted information and referral services, committed peer support volunteers, and a robust community outreach and engagement program, so every senior can access the programs, supports, and services they need.',
    '1-800-563-5599',
    'info@seniorsnl.ca',
    'https://www.seniorsnl.ca/',
    '243 Topsail Road, Suite 110',
    'St. John''s',
    'NL',
    'A1E 0G5',
    'Canada',
    47.522,
    -52.735,
    'America/St_Johns',
    'active',
    1989,
    'classic',
    '{"facebook": "https://www.facebook.com/SeniorsNL/", "instagram": "https://www.instagram.com/seniorsnl/", "linkedin": "https://www.linkedin.com/company/106485113", "youtube": "https://www.youtube.com/@seniorsnl6047", "phone_secondary": "709-737-2333", "fax": "709-737-3717", "tags": ["seniors", "non-profit", "charitable", "information and referral", "peer support", "community outreach", "social prescribing", "50+", "health", "wellness"]}'::jsonb,
    now(), now()
  ) RETURNING id INTO b_id;

  INSERT INTO business_hours (id, business_id, day_of_week, opens_at, closes_at, is_closed, created_at)
  VALUES
    (gen_random_uuid(), b_id, 0, '08:30'::time, '16:30'::time, false, now()),
    (gen_random_uuid(), b_id, 1, '08:30'::time, '16:30'::time, false, now()),
    (gen_random_uuid(), b_id, 2, '08:30'::time, '16:30'::time, false, now()),
    (gen_random_uuid(), b_id, 3, '08:30'::time, '16:30'::time, false, now()),
    (gen_random_uuid(), b_id, 4, '08:30'::time, '16:30'::time, false, now()),
    (gen_random_uuid(), b_id, 5, '08:30'::time, '16:30'::time, true, now()),
    (gen_random_uuid(), b_id, 6, '08:30'::time, '16:30'::time, true, now());

  INSERT INTO business_services (id, business_id, service_id, name, description, price, currency, price_type, duration_minutes, booking_required, is_active, metadata, created_at, updated_at)
  VALUES
    (gen_random_uuid(), b_id, NULL, 'Information & Referral', 'Trusted information and referral to programs, supports, and services for seniors aged 50+. Call 1-800-563-5599.', 0.00, 'CAD', 'fixed', NULL, true, true, '{"phone": "1-800-563-5599"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Peer Support', 'Volunteer-led peer support programs for seniors across the province.', 0.00, 'CAD', 'fixed', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Community Outreach', 'Events, workshops, and engagement programs for older adults in communities across NL.', 0.00, 'CAD', 'fixed', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Social Prescribing', 'Connecting seniors with community-based activities and supports through healthcare pathways.', 0.00, 'CAD', 'fixed', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'NL 50+ Federation Programs', 'Provincial federation programming and a network of 50+ clubs across Newfoundland and Labrador.', 0.00, 'CAD', 'fixed', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Brochures & Documents', 'Downloadable brochures and documents on topics that matter to seniors.', 0.00, 'CAD', 'fixed', NULL, true, true, '{"url": "https://www.seniorsnl.ca/brochures"}'::jsonb, now(), now());

  INSERT INTO business_categories (business_id, category_id, created_at)
  SELECT b_id, c.id, now() FROM categories c WHERE c.slug IN ('non-profit');

  INSERT INTO business_photos (id, business_id, url, alt_text, is_cover, sort_order, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=600&fit=crop', 'Community support gathering', true, 0, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop', 'Senior wellness program', false, 1, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=600&fit=crop', 'Older adults enjoying a group activity', false, 2, now());

  INSERT INTO ai_configurations (id, business_id, enabled, greeting, personality, escalation_enabled, handoff_enabled, language, model_provider, model_name, configuration, voice_enabled, preferred_language, created_at, updated_at)
  VALUES (
    gen_random_uuid(), b_id, true,
    'Welcome to SeniorsNL! We support people aged 50 and older across Newfoundland and Labrador. How can I help you today?',
    'Warm, patient, and caring assistant experienced with seniors'' needs.',
    true, false,
    'en', 'openai', 'gpt-4o-mini',
    '{"system_prompt": "You are a helpful assistant for SeniorsNL, a non-profit charitable organization supporting people aged 50+ in Newfoundland and Labrador. You help with information about information and referral services, peer support, community outreach, social prescribing, the NL 50+ Federation, and volunteering. You are warm, patient, and caring.", "greeting": "Welcome to SeniorsNL! We support people aged 50 and older across Newfoundland and Labrador. How can I help you today?"}'::jsonb,
    false, 'en', now(), now()
  );

  INSERT INTO ai_knowledge_items (id, business_id, title, content, category, is_active, metadata, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'Services', 'SeniorsNL offers Information & Referral (call 1-800-563-5599 or 709-737-2333), Peer Support Programs, Community Outreach & Engagement, Social Prescribing, NL 50+ Federation Programs, and free downloadable brochures. All services are free.', 'services', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'History & Location', 'Founded in 1989, SeniorsNL is located at 243 Topsail Road, Suite 110, St. John''s, NL A1E 0G5. Open Monday to Friday, 8:30 AM to 4:30 PM. It is the only information and referral service in NL dedicated specifically to older adults.', 'about', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Leadership & People', 'SeniorsNL is governed by a volunteer Board of Directors and staffed by information specialists, peer support volunteers, social prescribing link workers, and community outreach coordinators.', 'about', true, '{}'::jsonb, now());

END $$;

-- ============================================================
-- 8. TECHNL
-- ============================================================
DO $$ DECLARE b_id uuid; BEGIN
  INSERT INTO businesses (id, name, slug, description, phone, email, website_url, address_line_1, city, province, postal_code, country, latitude, longitude, timezone, status, founded_year, website_template, metadata, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'techNL',
    'technl',
    'techNL is a not-for-profit membership association accelerating the growth of the technology sector in Newfoundland and Labrador. It provides member companies with business growth services, visibility, a collective voice, and community, and delivers workforce programs including the AI Skills Launchpad, Mentorship Program, Graduate Transition Initiative, High School Tech Immersion, and Innovation Week.',
    '709-772-8324',
    'info@technl.ca',
    'https://technl.ca/',
    '710 Torbay Road, Co. Innovation Centre',
    'St. John''s',
    'NL',
    'A1A 5G9',
    'Canada',
    47.595,
    -52.713,
    'America/St_Johns',
    'active',
    NULL,
    'modern',
    '{"facebook": "https://www.facebook.com/NLTechNL", "youtube": "https://www.youtube.com/@technl1433", "linkedin": "https://www.linkedin.com/company/nltechnl/", "instagram": "https://www.instagram.com/_technl/", "fax": "709-757-6284", "tags": ["technology", "non-profit", "membership", "association", "AI", "mentorship", "talent", "startups", "innovation", "health plan", "graduates", "jobs"]}'::jsonb,
    now(), now()
  ) RETURNING id INTO b_id;

  INSERT INTO business_hours (id, business_id, day_of_week, opens_at, closes_at, is_closed, created_at)
  VALUES
    (gen_random_uuid(), b_id, 0, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 1, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 2, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 3, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 4, '09:00'::time, '17:00'::time, false, now()),
    (gen_random_uuid(), b_id, 5, '09:00'::time, '17:00'::time, true, now()),
    (gen_random_uuid(), b_id, 6, '09:00'::time, '17:00'::time, true, now());

  INSERT INTO business_services (id, business_id, service_id, name, description, price, currency, price_type, duration_minutes, booking_required, is_active, metadata, created_at, updated_at)
  VALUES
    (gen_random_uuid(), b_id, NULL, 'Tech Company Membership', 'Full membership for NL tech companies: growth services, visibility, advocacy, and community.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'AI Skills Launchpad', 'Program building applied AI skills across the NL workforce.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Mentorship Program', 'Connects mentees with experienced tech professionals for career guidance.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Graduate Transition Initiative', 'Helps recent graduates transition into tech careers in NL.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'High School Tech Immersion', 'Introduces high school students to technology careers through hands-on experiences.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Innovation Week', 'Annual celebration of innovation and technology in Newfoundland and Labrador.', NULL, 'CAD', 'quote_required', NULL, true, true, '{"frequency": "annual"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Job Listings Board', 'Free job board for tech positions in NL; employers can post openings.', 0.00, 'CAD', 'fixed', NULL, true, true, '{"url": "https://technl.ca/job-seekers/"}'::jsonb, now(), now()),
    (gen_random_uuid(), b_id, NULL, 'Tech Sector Group Health Plan', 'Group health and dental insurance plan designed for tech sector employees.', NULL, 'CAD', 'quote_required', NULL, true, true, '{}'::jsonb, now(), now());

  INSERT INTO business_categories (business_id, category_id, created_at)
  SELECT b_id, c.id, now() FROM categories c WHERE c.slug IN ('non-profit', 'technology');

  INSERT INTO business_photos (id, business_id, url, alt_text, is_cover, sort_order, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop', 'Modern tech office', true, 0, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop', 'Tech conference audience', false, 1, now()),
    (gen_random_uuid(), b_id, 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop', 'Tech mentorship conversation', false, 2, now());

  INSERT INTO ai_configurations (id, business_id, enabled, greeting, personality, escalation_enabled, handoff_enabled, language, model_provider, model_name, configuration, voice_enabled, preferred_language, created_at, updated_at)
  VALUES (
    gen_random_uuid(), b_id, true,
    'Welcome to techNL! We accelerate the growth of Newfoundland and Labrador''s tech sector through membership, programs, and community. How can I help you today?',
    'Knowledgeable, professional ecosystem connector with a community focus.',
    true, false,
    'en', 'openai', 'gpt-4o-mini',
    '{"system_prompt": "You are a helpful assistant for techNL, a not-for-profit membership association for the technology sector in Newfoundland and Labrador. You help with information about membership options, workforce programs (AI Skills Launchpad, Mentorship Program, Graduate Transition Initiative, High School Tech Immersion), Innovation Week, the job board, and the group health plan. You are knowledgeable, professional, and community-focused.", "greeting": "Welcome to techNL! We accelerate the growth of Newfoundland and Labrador''s tech sector through membership, programs, and community. How can I help you today?"}'::jsonb,
    false, 'en', now(), now()
  );

  INSERT INTO ai_knowledge_items (id, business_id, title, content, category, is_active, metadata, created_at)
  VALUES
    (gen_random_uuid(), b_id, 'Programs', 'techNL delivers the AI Skills Launchpad, Mentorship Program, Graduate Transition Initiative, High School Tech Immersion Program, Innovation Week, and the Tech Sector Group Health Plan.', 'services', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Membership & Contact', 'Membership types include Tech Company, Sponsored Startup, Service Provider, and Alliance Partner, plus a free Student Network. Located at 710 Torbay Road, Co. Innovation Centre, St. John''s, NL A1A 5G9. Phone 709-772-8324, email info@technl.ca.', 'about', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Sector Impact', 'techNL has driven NL tech sector growth for 30+ years. NL has attracted $780M+ in tech investment over the past decade and is home to Canada''s first AI unicorn.', 'about', true, '{}'::jsonb, now()),
    (gen_random_uuid(), b_id, 'Events & Resources', 'techNL hosts Innovation Week and the annual Industry Awards, publishes The State of Tech Report, and maintains a free job board at technl.ca/job-seekers.', 'faq', true, '{}'::jsonb, now());

END $$;