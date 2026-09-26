-- ============================================================================
-- Origins Atlas — Database Reset & Realistic Seed Data
-- ============================================================================
-- This script:
-- 1. Grants all table & schema permissions to anon and authenticated roles
-- 2. Cleanly deletes / truncates any existing data across all tables
-- 3. Generates REAL runtime UUIDs using Postgres gen_random_uuid()
-- 4. Inserts production-grade, realistic Thai real estate data
-- ============================================================================

-- Step 1: Ensure public access privileges are active for Supabase client
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Step 2: Cleanly delete all existing records (cascading)
TRUNCATE TABLE duplicate_reviews, verifications, price_history, source_listings, houses, agents, communities CASCADE;

-- Step 3: Insert realistic data with dynamic, database-generated UUIDs
DO $$
DECLARE
  -- 1. Community ID
  v_community_id UUID := gen_random_uuid();

  -- 2. Agent IDs (Real prominent agencies in Bangkok)
  v_agent_108siam UUID := gen_random_uuid();
  v_agent_propscout UUID := gen_random_uuid();
  v_agent_connex UUID := gen_random_uuid();
  v_agent_agentplus UUID := gen_random_uuid();

  -- 3. Canonical Houses IDs (Physical properties)
  v_house_a UUID := gen_random_uuid(); -- Unit 88/12 (4 bed, 4 bath, 289 sqm)
  v_house_b UUID := gen_random_uuid(); -- Unit 88/14 (5 bed, 4 bath, 358 sqm)
  v_house_c UUID := gen_random_uuid(); -- Unit 88/19 (3 bed, 4 bath, 245 sqm)
  v_house_d UUID := gen_random_uuid(); -- Unit 88/21 (4 bed, 4 bath, 329 sqm)
  v_house_e UUID := gen_random_uuid(); -- Unit 88/28 (4 bed, 5 bath, 310 sqm)
  v_house_f UUID := gen_random_uuid(); -- Unit 88/35 (4 bed, 4 bath, 289 sqm - potential duplicate of 88/12)

  -- 4. Source Listing IDs (from Hipflat platform)
  v_listing_1 UUID := gen_random_uuid();
  v_listing_2 UUID := gen_random_uuid();
  v_listing_3 UUID := gen_random_uuid();
  v_listing_4 UUID := gen_random_uuid();
  v_listing_5 UUID := gen_random_uuid();
  v_listing_6 UUID := gen_random_uuid();
  v_listing_7 UUID := gen_random_uuid();
  v_listing_8 UUID := gen_random_uuid();

BEGIN

  -- ==========================================================================
  -- 1. COMMUNITY: Nirvana Absolute Bangna
  -- ==========================================================================
  INSERT INTO communities (
    id, name, slug, description, location, city, province, country,
    total_units, community_type, amenities, image_url, latitude, longitude
  ) VALUES (
    v_community_id,
    'Nirvana Absolute Bangna',
    'nirvana-absolute-bangna',
    'Nirvana Absolute Bangna is a premier luxury gated community situated on Bangna-Trat KM 12. Designed with modern tropical architecture, underground cabling, private clubhouse, saltwater pool, and 24/7 dual-gate biometric security.',
    'Bangna-Trat KM 12, Bang Phli',
    'Bangkok Metro',
    'Samut Prakan',
    'TH',
    30,
    'gated_community',
    ARRAY[
      'Saltwater Swimming Pool',
      'Fitness Studio & Crossfit Zone',
      'Exclusive Resident Clubhouse',
      'Double Gate Biometric Security',
      '24-Hour CCTV Surveillance',
      'Central Park & Jogging Track',
      'Underground Electrical Cabling',
      'EV Charging Stations',
      'Children Playground'
    ],
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80',
    13.6350000,
    100.6510000
  );

  -- ==========================================================================
  -- 2. AGENTS / AGENCIES
  -- ==========================================================================
  INSERT INTO agents (
    id, name, source_platform, contact_email, contact_phone, website_url, logo_url, is_verified
  ) VALUES
    (
      v_agent_108siam,
      '108Siam Sales and Rentals',
      'Hipflat',
      'contact@108siam.com',
      '+66 2 712 8555',
      'https://www.108siam.com',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
      true
    ),
    (
      v_agent_propscout,
      'PropertyScout Great Deals',
      'Hipflat',
      'inquiries@propertyscout.co.th',
      '+66 2 026 8320',
      'https://propertyscout.co.th',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      true
    ),
    (
      v_agent_connex,
      'Connex Property Bangkok',
      'Hipflat',
      'sales@connexproperty.co.th',
      '+66 62 879 9395',
      'https://connexproperty.co.th',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
      true
    ),
    (
      v_agent_agentplus,
      'Agentplus Real Estate',
      'Hipflat',
      'info@agentplus.co.th',
      '+66 89 445 6112',
      'https://agentplus.co.th',
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80',
      true
    );

  -- ==========================================================================
  -- 3. CANONICAL PHYSICAL HOUSES
  -- ==========================================================================
  INSERT INTO houses (
    id, community_id, house_number, address, property_type,
    bedrooms, bathrooms, parking_spaces, house_size_sqm, land_size_sqm, floors, year_built,
    features, description, main_image_url, image_urls,
    status, is_new_listing, has_price_reduction, latitude, longitude
  ) VALUES
    -- House A (Unit 88/12): 4 bed, 4 bath, 289 sqm living space
    (
      v_house_a,
      v_community_id,
      '88/12',
      '88/12 Nirvana Absolute Bangna, Bangna-Trat KM 12, Bang Phli, Samut Prakan 10540',
      'detached_house',
      4, 4, 3, 289.00, 340.00, 2, 2023,
      ARRAY['Corner Plot', 'Private Landscaped Garden', 'Double Volume Living Room', 'Western Built-in Kitchen', 'Maid Quarter with En-suite', 'EV Charger Connection'],
      'Corner-plot 2-story detached luxury villa in Nirvana Absolute Bangna. 289 sqm living space with contemporary minimalist design, high ceilings, floor-to-ceiling glass, and landscaped garden. Cross-listed by multiple agencies with documented price decrease.',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      ARRAY[
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
      ],
      'active', false, true, 13.6352000, 100.6512000
    ),

    -- House B (Unit 88/14): 5 bed, 4 bath, 358 sqm living space (Largest layout)
    (
      v_house_b,
      v_community_id,
      '88/14',
      '88/14 Nirvana Absolute Bangna, Bangna-Trat KM 12, Bang Phli, Samut Prakan 10540',
      'detached_house',
      5, 4, 4, 358.00, 420.00, 2, 2023,
      ARRAY['Grand Master Bedroom Suite', 'Ground Floor Elderly Suite', 'Smart Home Automation', 'Solar Rooftop Ready', '4 Covered Parking Bays', 'Private Swimming Pool Option'],
      'The premier 5-bedroom layout in Nirvana Absolute Bangna. 358 sqm of expansive family living space, featuring an open-concept living pavilion, multi-car garage, and ground-floor elder suite.',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      ARRAY[
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80'
      ],
      'active', true, false, 13.6354000, 100.6514000
    ),

    -- House C (Unit 88/19): 3 bed, 4 bath, 245 sqm living space
    (
      v_house_c,
      v_community_id,
      '88/19',
      '88/19 Nirvana Absolute Bangna, Bangna-Trat KM 12, Bang Phli, Samut Prakan 10540',
      'detached_house',
      3, 4, 3, 245.00, 285.00, 2, 2023,
      ARRAY['En-suite Bathrooms in All Bedrooms', 'Private Patio', 'Built-in Storage Systems', 'High-Security Digital Door Lock'],
      'Elegant 3-bedroom detached home with 4 en-suite bathrooms and 3 parking stalls. Efficient floor plan with exceptional natural lighting throughout.',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      ARRAY[
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80'
      ],
      'active', true, false, 13.6348000, 100.6508000
    ),

    -- House D (Unit 88/21): 4 bed, 4 bath, 329 sqm living space
    (
      v_house_d,
      v_community_id,
      '88/21',
      '88/21 Nirvana Absolute Bangna, Bangna-Trat KM 12, Bang Phli, Samut Prakan 10540',
      'detached_house',
      4, 4, 3, 329.00, 380.00, 2, 2023,
      ARRAY['Imported Italian Kitchen', 'Double-Height Foyer', 'Covered Outdoor Terrace', 'Automated Garden Sprinklers', 'High-Efficiency Inverter ACs'],
      'Signature 329 sqm 4-bedroom villa featuring double-height ceiling over the main living lounge, bespoke Italian kitchen, and serene garden orientation.',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
      ARRAY[
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80'
      ],
      'active', true, false, 13.6356000, 100.6516000
    ),

    -- House E (Unit 88/28): 4 bed, 5 bath, 310 sqm living space
    (
      v_house_e,
      v_community_id,
      '88/28',
      '88/28 Nirvana Absolute Bangna, Bangna-Trat KM 12, Bang Phli, Samut Prakan 10540',
      'detached_house',
      4, 5, 3, 310.00, 360.00, 2, 2023,
      ARRAY['5 En-suite Bathrooms', 'Separate Powder Room', 'Walk-in Pantry', 'Upper Floor Sunset Balcony', 'Dual Master Closets'],
      'Rare 5-bathroom model where every single bedroom possesses a private luxury en-suite bathroom plus a separate ground-floor guest powder room.',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
      ARRAY[
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80'
      ],
      'active', true, false, 13.6358000, 100.6518000
    ),

    -- House F (Unit 88/35): 4 bed, 4 bath, 289 sqm (Candidate duplicate of House 88/12)
    (
      v_house_f,
      v_community_id,
      '88/35',
      '88/35 Nirvana Absolute Bangna, Bangna-Trat KM 12, Bang Phli, Samut Prakan 10540',
      'detached_house',
      4, 4, 3, 289.00, 340.00, 2, 2023,
      ARRAY['Standard Developer Finishes', '3 Parking Spaces', 'Private Garden', 'En-suite Master'],
      '4-bedroom detached villa listed by Agentplus. Flagged by duplicate resolution engine for potential merge into House 88/12 due to identical floor specs and pricing history.',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80',
      ARRAY[
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80'
      ],
      'pending_review', false, false, 13.6351000, 100.6511000
    );

  -- ==========================================================================
  -- 4. SOURCE LISTINGS (Connecting external Hipflat posts to canonical houses)
  -- ==========================================================================
  INSERT INTO source_listings (
    id, house_id, agent_id, source_url, source_listing_id,
    asking_price_usd, asking_price_thb, price_per_sqm_usd,
    listing_date, last_seen_date, is_active, listing_description
  ) VALUES
    -- Listing #1: House A (88/12) listed by 108Siam ($636,775 / 23.45M THB)
    (
      v_listing_1,
      v_house_a,
      v_agent_108siam,
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-1081',
      'HF-BKK-1081',
      636775.00, 23450000.00, 2203.00,
      '2024-09-01', '2024-09-25', true,
      'Nirvana Absolute Bangna - 4 bed, 4 bath, 289 sqm luxury detached home. Fully fitted modern kitchen, maid quarters, 3 parking. Listed by 108Siam.'
    ),

    -- Listing #2: House B (88/14) listed by PropertyScout ($858,002 / 31.60M THB)
    (
      v_listing_2,
      v_house_b,
      v_agent_propscout,
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-2094',
      'HF-BKK-2094',
      858002.00, 31600000.00, 2396.00,
      '2024-09-01', '2024-09-25', true,
      'Nirvana Absolute Bangna - 5 bed, 4 bath, 358 sqm grand residence. Premium plot with pool provision and 4 covered parking.'
    ),

    -- Listing #3: House A (88/12) listed by PropertyScout ($582,963 / 21.45M THB) -> PRICE DROP!
    (
      v_listing_3,
      v_house_a,
      v_agent_propscout,
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-3310',
      'HF-BKK-3310',
      582963.00, 21450000.00, 2017.00,
      '2024-08-15', '2024-09-25', true,
      'Hot Deal! Nirvana Absolute Bangna - 4 bed, 4 bath, 289 sqm. Significant price drop from original owner asking price. Listed by PropertyScout.'
    ),

    -- Listing #4: House C (88/19) listed by Connex Property ($594,922 / 21.90M THB)
    (
      v_listing_4,
      v_house_c,
      v_agent_connex,
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-4155',
      'HF-BKK-4155',
      594922.00, 21900000.00, 2428.00,
      '2024-09-05', '2024-09-25', true,
      'Nirvana Absolute Bangna - 3 bed, 4 bath with 3 parking spaces. Well designed home close to clubhouse. Listed by Connex Property.'
    ),

    -- Listing #5: House D (88/21) listed by PropertyScout ($717,493 / 26.40M THB)
    (
      v_listing_5,
      v_house_d,
      v_agent_propscout,
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-5821',
      'HF-BKK-5821',
      717493.00, 26400000.00, 2180.00,
      '2024-09-01', '2024-09-25', true,
      'Spacious 4 bedroom, 4 bathroom detached house in Nirvana Absolute Bangna. 329 sqm with imported finishes.'
    ),

    -- Listing #6: House E (88/28) listed by Connex Property ($956,658 / 35.20M THB)
    (
      v_listing_6,
      v_house_e,
      v_agent_connex,
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-6739',
      'HF-BKK-6739',
      956658.00, 35200000.00, 3086.00,
      '2024-08-20', '2024-09-25', true,
      'Exclusive 4 bedroom, 5 bathroom villa. Highest specification in the community with en-suite bathrooms in all rooms.'
    ),

    -- Listing #7: House F (88/35) listed by Agentplus ($878,630 / 32.35M THB)
    (
      v_listing_7,
      v_house_f,
      v_agent_agentplus,
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-7402',
      'HF-BKK-7402',
      878630.00, 32350000.00, 3040.00,
      '2024-09-10', '2024-09-25', true,
      'Nirvana Absolute Bangna 4 bed, 4 bath. Modern luxury house with high security and privacy.'
    ),

    -- Listing #8: House F (88/35) listed by Agentplus ($636,775 / 23.45M THB) -> matches House A price
    (
      v_listing_8,
      v_house_f,
      v_agent_agentplus,
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-8910',
      'HF-BKK-8910',
      636775.00, 23450000.00, 2203.00,
      '2024-08-01', '2024-09-25', true,
      'Special promotional price for 4 bedroom detached villa in Nirvana Absolute Bangna. Agentplus exclusive.'
    );

  -- ==========================================================================
  -- 5. PRICE HISTORY (Tracking changes over time)
  -- ==========================================================================
  INSERT INTO price_history (
    source_listing_id, house_id, price_usd, price_thb, price_per_sqm_usd,
    recorded_date, change_type, change_amount_usd, change_percentage, notes
  ) VALUES
    -- Listing 1 initial price
    (v_listing_1, v_house_a, 636775.00, 23450000.00, 2203.00, '2024-09-01', 'initial', 0.00, 0.00, 'Initial recorded listing price from 108Siam'),

    -- Listing 2 initial price
    (v_listing_2, v_house_b, 858002.00, 31600000.00, 2396.00, '2024-09-01', 'initial', 0.00, 0.00, 'Initial recorded listing price from PropertyScout'),

    -- Listing 3: Initial price then price drop of $53,812 (-8.45%)
    (v_listing_3, v_house_a, 636775.00, 23450000.00, 2203.00, '2024-08-15', 'initial', 0.00, 0.00, 'Initial price recorded at launch'),
    (v_listing_3, v_house_a, 582963.00, 21450000.00, 2017.00, '2024-09-10', 'decrease', -53812.00, -8.45, 'Agent reduced asking price by 2,000,000 THB to stimulate interest'),

    -- Listing 4 initial price
    (v_listing_4, v_house_c, 594922.00, 21900000.00, 2428.00, '2024-09-05', 'initial', 0.00, 0.00, 'Initial recorded listing price from Connex Property'),

    -- Listing 5 initial price
    (v_listing_5, v_house_d, 717493.00, 26400000.00, 2180.00, '2024-09-01', 'initial', 0.00, 0.00, 'Initial recorded listing price from PropertyScout'),

    -- Listing 6 initial price
    (v_listing_6, v_house_e, 956658.00, 35200000.00, 3086.00, '2024-08-20', 'initial', 0.00, 0.00, 'Initial recorded listing price from Connex Property'),

    -- Listing 7 initial price
    (v_listing_7, v_house_f, 878630.00, 32350000.00, 3040.00, '2024-09-10', 'initial', 0.00, 0.00, 'Initial recorded listing price from Agentplus'),

    -- Listing 8 initial price
    (v_listing_8, v_house_f, 636775.00, 23450000.00, 2203.00, '2024-08-01', 'initial', 0.00, 0.00, 'Promotional summer price from Agentplus');

  -- ==========================================================================
  -- 6. VERIFICATIONS
  -- ==========================================================================
  INSERT INTO verifications (
    house_id, verification_status, verification_date, verified_by, verification_method, evidence_url, notes
  ) VALUES
    (
      v_house_a,
      'verified',
      '2024-09-20 10:30:00+00',
      'Joseph Semling (Origins Atlas)',
      'manual',
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-1081',
      'Cross-referenced against 108Siam and PropertyScout listings. Cadastral parcel verified at Bangna Land Office.'
    ),
    (
      v_house_b,
      'verified',
      '2024-09-20 14:15:00+00',
      'Joseph Semling (Origins Atlas)',
      'manual',
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-2094',
      'Unique 5-bedroom model verified against Nirvana Absolute developer master plan.'
    ),
    (
      v_house_c,
      'pending',
      NULL,
      NULL,
      'agent',
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-4155',
      'Single source listing from Connex Property. Awaiting title deed copy.'
    ),
    (
      v_house_d,
      'verified',
      '2024-09-21 09:00:00+00',
      'Joseph Semling (Origins Atlas)',
      'manual',
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-5821',
      '329 sqm floor plan verified on site at Bangna KM 12.'
    ),
    (
      v_house_e,
      'pending',
      NULL,
      NULL,
      NULL,
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-6739',
      'Connex Property listing under preliminary review.'
    ),
    (
      v_house_f,
      'disputed',
      NULL,
      NULL,
      NULL,
      'https://www.hipflat.com/listings/bangkok-house-nirvana-absolute-bangna-hf-bkk-8910',
      'Flagged by duplicate detection engine: potential duplicate of Unit 88/12.'
    );

  -- ==========================================================================
  -- 7. DUPLICATE REVIEWS (Side-by-side reconciliation)
  -- ==========================================================================
  INSERT INTO duplicate_reviews (
    house_id_a, house_id_b, match_score, match_reasons, status, notes
  ) VALUES (
    v_house_a,
    v_house_f,
    0.78,
    ARRAY['same_community', 'matching_price_point', 'identical_bedroom_count', 'identical_bathroom_count', 'matching_square_meters'],
    'pending',
    'House Unit 88/12 ($636,775 by 108Siam) matches House Unit 88/35 ($636,775 by Agentplus). Both are 4 bed/4 bath, 289 sqm in Nirvana Absolute Bangna. High probability of agent double-listing on Hipflat. Manual physical unit inspection recommended before merging records.'
  );

END $$;

-- Verify seeded counts
SELECT 'communities' AS table_name, count(*) FROM communities
UNION ALL
SELECT 'agents', count(*) FROM agents
UNION ALL
SELECT 'houses', count(*) FROM houses
UNION ALL
SELECT 'source_listings', count(*) FROM source_listings
UNION ALL
SELECT 'price_history', count(*) FROM price_history
UNION ALL
SELECT 'verifications', count(*) FROM verifications
UNION ALL
SELECT 'duplicate_reviews', count(*) FROM duplicate_reviews;
