-- One Place: seed data — initial NL category tree and sample businesses.
-- Sample businesses are active so discovery, search and chat work end-to-end.

-- ---------------------------------------------------------------------------
-- Categories (two-level: parent → child)
-- ---------------------------------------------------------------------------

insert into public.categories (slug, name, description, icon, sort_order) values
    ('beauty-hair', 'Beauty & Hair', 'Salons, barbershops, nails and esthetics.', 'sparkles', 1),
    ('health-wellness', 'Health & Wellness', 'Spas, massage and fitness.', 'heart', 2),
    ('home-living', 'Home & Living', 'Cleaning, repairs and home services.', 'home', 3);

insert into public.categories (parent_id, slug, name, description, icon, sort_order) values
    ((select id from public.categories where slug = 'beauty-hair'), 'hair-salon', 'Hair Salon', 'Cuts, colour, styling and treatments.', 'scissors', 1),
    ((select id from public.categories where slug = 'beauty-hair'), 'barber-shop', 'Barber Shop', 'Cuts, beard trims and hot towel shaves.', 'scissors', 2),
    ((select id from public.categories where slug = 'beauty-hair'), 'nail-beauty', 'Nails & Beauty', 'Manicures, pedicures, lashes and brows.', 'sparkles', 3),
    ((select id from public.categories where slug = 'health-wellness'), 'day-spa', 'Day Spa', 'Massage, facials and body treatments.', 'heart', 1),
    ((select id from public.categories where slug = 'health-wellness'), 'massage', 'Massage Therapy', 'Relaxation, deep tissue and therapeutic massage.', 'heart', 2),
    ((select id from public.categories where slug = 'health-wellness'), 'fitness', 'Fitness & Gym', 'Gyms, personal training and classes.', 'dumbbell', 3),
    ((select id from public.categories where slug = 'home-living'), 'house-cleaning', 'House Cleaning', 'Regular, deep and move-out cleaning.', 'home', 1),
    ((select id from public.categories where slug = 'home-living'), 'home-repair', 'Home Repair', 'Handyman, plumbing, electrical and repairs.', 'wrench', 2);

-- ---------------------------------------------------------------------------
-- Sample businesses
-- ---------------------------------------------------------------------------

insert into public.businesses (
    slug, name, description, phone, email, website_url,
    address_line_1, city, province, postal_code, country,
    timezone, status, verification_status
) values
    (
        'the-velvet-comb',
        'The Velvet Comb',
        'A neighbourhood hair salon on Duckworth Street. Cuts, colour, balayage and special-occasion styling for all hair types.',
        '(709) 555-0134', 'hello@thevelvetcomb.ca', 'https://thevelvetcomb.ca',
        '124 Duckworth Street', 'St. John''s', 'NL', 'A1C 1G4', 'CA',
        'America/St_Johns', 'active', 'verified'
    ),
    (
        'water-street-barbers',
        'Water Street Barbers',
        'Classic barbershop with a modern edge. Fades, traditional cuts, beard trims and hot towel shaves.',
        '(709) 555-0122', 'book@waterstreetbarbers.ca', 'https://waterstreetbarbers.ca',
        '210 Water Street', 'St. John''s', 'NL', 'A1C 1A5', 'CA',
        'America/St_Johns', 'active', 'verified'
    ),
    (
        'dory-nail-bar',
        'Dory Nail Bar',
        'Nail care and beauty studio. Manicures, pedicures, gel, lashes and brow shaping.',
        '(709) 555-0188', 'hello@dorynailbar.ca', 'https://dorynailbar.ca',
        '8 Elizabeth Avenue', 'St. John''s', 'NL', 'A1C 3J1', 'CA',
        'America/St_Johns', 'active', 'verified'
    ),
    (
        'rosewater-day-spa',
        'Rosewater Day Spa',
        'A calm escape in the heart of the city. Massage, facials, wraps and couples treatments.',
        '(709) 555-0141', 'spa@rosewaterdayspa.ca', 'https://rosewaterdayspa.ca',
        '55 Kings Bridge Road', 'St. John''s', 'NL', 'A1C 3K3', 'CA',
        'America/St_Johns', 'active', 'verified'
    ),
    (
        'still-waters-massage',
        'Still Waters Massage Therapy',
        'Registered massage therapists focused on relaxation, injury recovery and chronic pain relief.',
        '(709) 555-0169', 'care@stillwatersmassage.ca', 'https://stillwatersmassage.ca',
        '31 Portugal Cove Road', 'St. John''s', 'NL', 'A1B 2H6', 'CA',
        'America/St_Johns', 'active', 'verified'
    ),
    (
        'harbourview-fitness',
        'Harbourview Fitness',
        'Community gym overlooking the harbour. Strength and cardio equipment, group classes and personal training.',
        '(709) 555-0170', 'team@harbourviewfitness.ca', 'https://harbourviewfitness.ca',
        '78 Harbour Drive', 'St. John''s', 'NL', 'A1C 2A2', 'CA',
        'America/St_Johns', 'active', 'verified'
    ),
    (
        'tidy-harbour-cleaning',
        'Tidy Harbour Cleaning',
        'Friendly, reliable residential cleaning. Regular cleans, deep cleans and move-in/move-out.',
        '(709) 555-0119', 'tidy@tidyharbourcleaning.ca', 'https://tidyharbourcleaning.ca',
        '9 Forest Road', 'St. John''s', 'NL', 'A1A 1Y5', 'CA',
        'America/St_Johns', 'active', 'verified'
    ),
    (
        'jakes-handyman',
        'Jake''s Handyman Service',
        'Honest, local handyman work: small repairs, painting, shelving, fixtures and seasonal maintenance.',
        '(709) 555-0107', 'jake@jakeshandyman.ca', 'https://jakeshandyman.ca',
        '44 Freshwater Road', 'St. John''s', 'NL', 'A1C 2N8', 'CA',
        'America/St_Johns', 'active', 'verified'
    );

-- ---------------------------------------------------------------------------
-- Business ↔ category links
-- ---------------------------------------------------------------------------

insert into public.business_categories (business_id, category_id, is_primary) values
    ((select id from public.businesses where slug = 'the-velvet-comb'),   (select id from public.categories where slug = 'hair-salon'), true),
    ((select id from public.businesses where slug = 'water-street-barbers'), (select id from public.categories where slug = 'barber-shop'), true),
    ((select id from public.businesses where slug = 'dory-nail-bar'),     (select id from public.categories where slug = 'nail-beauty'), true),
    ((select id from public.businesses where slug = 'rosewater-day-spa'), (select id from public.categories where slug = 'day-spa'), true),
    ((select id from public.businesses where slug = 'rosewater-day-spa'), (select id from public.categories where slug = 'massage'), false),
    ((select id from public.businesses where slug = 'still-waters-massage'), (select id from public.categories where slug = 'massage'), true),
    ((select id from public.businesses where slug = 'harbourview-fitness'), (select id from public.categories where slug = 'fitness'), true),
    ((select id from public.businesses where slug = 'tidy-harbour-cleaning'), (select id from public.categories where slug = 'house-cleaning'), true),
    ((select id from public.businesses where slug = 'jakes-handyman'),    (select id from public.categories where slug = 'home-repair'), true);

-- ---------------------------------------------------------------------------
-- Sample services
-- ---------------------------------------------------------------------------

insert into public.business_services (
    business_id, name, description, price_type,
    min_price, max_price, currency, duration_minutes, booking_required, is_active
) values
    -- The Velvet Comb
    ((select id from public.businesses where slug = 'the-velvet-comb'),
     'Wash, Cut & Style', 'Consultation, wash, cut and finish.', 'fixed', 55.00, 55.00, 'CAD', 60, true, true),
    ((select id from public.businesses where slug = 'the-velvet-comb'),
     'Colour & Cut', 'Full colour or balayage with a cut and style.', 'range', 120.00, 220.00, 'CAD', 150, true, true),
    -- Water Street Barbers
    ((select id from public.businesses where slug = 'water-street-barbers'),
     'Classic Cut', 'Classic scissor or clipper cut.', 'fixed', 30.00, 30.00, 'CAD', 45, true, true),
    ((select id from public.businesses where slug = 'water-street-barbers'),
     'Beard Trim', 'Beard trim and shaping with hot towel finish.', 'fixed', 20.00, 20.00, 'CAD', 30, true, true),
    -- Dory Nail Bar
    ((select id from public.businesses where slug = 'dory-nail-bar'),
     'Classic Manicure', 'Shaping, cuticle care, polish and massage.', 'fixed', 40.00, 40.00, 'CAD', 45, true, true),
    ((select id from public.businesses where slug = 'dory-nail-bar'),
     'Gel Pedicure', 'Soak, scrub, gel polish and foot massage.', 'fixed', 60.00, 60.00, 'CAD', 60, true, true),
    -- Rosewater Day Spa
    ((select id from public.businesses where slug = 'rosewater-day-spa'),
     'Signature Massage (60 min)', 'Full-body Swedish or deep tissue.', 'fixed', 95.00, 95.00, 'CAD', 60, true, true),
    ((select id from public.businesses where slug = 'rosewater-day-spa'),
     'Hydrating Facial', 'Cleanse, exfoliate, mask and massage.', 'fixed', 85.00, 85.00, 'CAD', 60, true, true),
    -- Still Waters Massage
    ((select id from public.businesses where slug = 'still-waters-massage'),
     'Therapeutic Massage (45 min)', 'RMT session for tension and recovery.', 'fixed', 80.00, 80.00, 'CAD', 45, true, true),
    ((select id from public.businesses where slug = 'still-waters-massage'),
     'Therapeutic Massage (90 min)', 'Extended RMT session.', 'fixed', 140.00, 140.00, 'CAD', 90, true, true),
    -- Harbourview Fitness
    ((select id from public.businesses where slug = 'harbourview-fitness'),
     'Drop-in Day Pass', 'Full gym access for the day.', 'fixed', 15.00, 15.00, 'CAD', 0, false, true),
    ((select id from public.businesses where slug = 'harbourview-fitness'),
     'Personal Training (60 min)', 'One-on-one session with a certified trainer.', 'fixed', 70.00, 70.00, 'CAD', 60, true, true),
    -- Tidy Harbour Cleaning
    ((select id from public.businesses where slug = 'tidy-harbour-cleaning'),
     'Standard Clean', 'Kitchen, bathrooms, floors and dusting.', 'fixed', 120.00, 120.00, 'CAD', 120, false, true),
    ((select id from public.businesses where slug = 'tidy-harbour-cleaning'),
     'Deep Clean', 'Thorough top-to-bottom clean.', 'fixed', 250.00, 250.00, 'CAD', 240, true, true),
    -- Jake's Handyman
    ((select id from public.businesses where slug = 'jakes-handyman'),
     'Handyman Hourly Rate', 'General repairs and small jobs, billed hourly.', 'fixed', 55.00, 55.00, 'CAD', 60, false, true),
    ((select id from public.businesses where slug = 'jakes-handyman'),
     'Fixture Installation', 'Shelves, curtain rods, TVs and light fixtures.', 'quote_required', NULL, NULL, 'CAD', 60, false, true);

-- ---------------------------------------------------------------------------
-- Sample business hours (day 0 = Sunday … day 6 = Saturday)
-- ---------------------------------------------------------------------------

insert into public.business_hours (business_id, day_of_week, is_closed, opens_at, closes_at)
select b.id, d.day, false, d.opens_at, d.closes_at
from public.businesses b
cross join (
    values
        (0, '10:00'::time, '16:00'::time),
        (1, '09:00'::time, '19:00'::time),
        (2, '09:00'::time, '19:00'::time),
        (3, '09:00'::time, '19:00'::time),
        (4, '09:00'::time, '19:00'::time),
        (5, '09:00'::time, '17:00'::time),
        (6, '10:00'::time, '16:00'::time)
) as d(day, opens_at, closes_at)
where b.slug in ('the-velvet-comb', 'water-street-barbers', 'dory-nail-bar', 'rosewater-day-spa', 'still-waters-massage', 'harbourview-fitness', 'tidy-harbour-cleaning', 'jakes-handyman');
