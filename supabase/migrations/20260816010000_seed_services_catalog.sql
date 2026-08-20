-- Seed the global services catalog so onboarding can show services per category.

insert into public.services (category_id, name, description, is_active) values
    -- Hair Salon
    ((select id from public.categories where slug = 'hair-salon'),
     'Hair Cut', 'Basic cut, trim or restyle.', true),
    ((select id from public.categories where slug = 'hair-salon'),
     'Hair Colour', 'Full colour, highlights, balayage or touch-up.', true),
    ((select id from public.categories where slug = 'hair-salon'),
     'Blow Dry & Style', 'Wash, blow-dry and finishing style.', true),
    -- Barber Shop
    ((select id from public.categories where slug = 'barber-shop'),
     'Haircut', 'Classic scissor or clipper cut.', true),
    ((select id from public.categories where slug = 'barber-shop'),
     'Beard Trim', 'Beard shaping, trim and hot towel finish.', true),
    -- Nails & Beauty
    ((select id from public.categories where slug = 'nail-beauty'),
     'Manicure', 'Nail shaping, cuticle care and polish.', true),
    ((select id from public.categories where slug = 'nail-beauty'),
     'Pedicure', 'Soak, scrub, polish and foot massage.', true),
    ((select id from public.categories where slug = 'nail-beauty'),
     'Lash & Brow', 'Lash extensions, lifts, tinting and brow shaping.', true),
    -- Day Spa
    ((select id from public.categories where slug = 'day-spa'),
     'Massage', 'Full-body relaxation or therapeutic massage.', true),
    ((select id from public.categories where slug = 'day-spa'),
     'Facial', 'Cleansing, exfoliation, mask and moisturising.', true),
    ((select id from public.categories where slug = 'day-spa'),
     'Body Treatment', 'Body wrap, scrub or exfoliation.', true),
    -- Massage Therapy
    ((select id from public.categories where slug = 'massage'),
     'Relaxation Massage', 'Gentle, full-body stress-relief massage.', true),
    ((select id from public.categories where slug = 'massage'),
     'Deep Tissue Massage', 'Targeted pressure for chronic tension and pain.', true),
    ((select id from public.categories where slug = 'massage'),
     'Sports Massage', 'Focused treatment for athletic recovery.', true),
    -- Fitness & Gym
    ((select id from public.categories where slug = 'fitness'),
     'Personal Training', 'One-on-one coaching and programming.', true),
    ((select id from public.categories where slug = 'fitness'),
     'Group Class', 'Scheduled instructor-led fitness class.', true),
    ((select id from public.categories where slug = 'fitness'),
     'Gym Membership', 'Recurring access to facilities and equipment.', true),
    -- House Cleaning
    ((select id from public.categories where slug = 'house-cleaning'),
     'Standard Clean', 'Regular maintenance clean of key areas.', true),
    ((select id from public.categories where slug = 'house-cleaning'),
     'Deep Clean', 'Thorough top-to-bottom cleaning session.', true),
    ((select id from public.categories where slug = 'house-cleaning'),
     'Move-in / Move-out Clean', 'Full clean for empty or vacating properties.', true),
    -- Home Repair
    ((select id from public.categories where slug = 'home-repair'),
     'Handyman Service', 'General repairs, small fixes and odd jobs.', true),
    ((select id from public.categories where slug = 'home-repair'),
     'Plumbing Repair', 'Faucet, toilet, pipe and fixture repairs.', true),
    ((select id from public.categories where slug = 'home-repair'),
     'Electrical Repair', 'Outlet, switch, fixture and wiring repairs.', true),
    ((select id from public.categories where slug = 'home-repair'),
     'Fixture Installation', 'Shelves, TVs, curtain rods and light fixtures.', true);
