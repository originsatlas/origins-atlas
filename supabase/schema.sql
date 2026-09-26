-- =============================================
-- Origins Atlas — Database Schema
-- Milestone 1: Foundation & Database Setup
-- =============================================
-- Run this SQL in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. COMMUNITIES
-- =============================================
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  location TEXT,
  city TEXT,
  province TEXT,
  country TEXT DEFAULT 'TH',
  total_units INT,
  community_type TEXT DEFAULT 'gated_community',
  amenities TEXT[] DEFAULT '{}',
  image_url TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. HOUSES (Canonical Physical Property)
-- =============================================
CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  house_number TEXT,
  address TEXT,
  property_type TEXT DEFAULT 'detached_house',
  bedrooms INT,
  bathrooms INT,
  parking_spaces INT,
  house_size_sqm DECIMAL(10, 2),
  land_size_sqm DECIMAL(10, 2),
  floors INT,
  year_built INT,
  features TEXT[] DEFAULT '{}',
  description TEXT,
  main_image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'unlisted', 'pending_review')),
  is_new_listing BOOLEAN DEFAULT true,
  has_price_reduction BOOLEAN DEFAULT false,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Unique constraint for duplicate prevention (when house_number is known)
  UNIQUE(community_id, house_number)
);

-- Index for community lookups
CREATE INDEX IF NOT EXISTS idx_houses_community_id ON houses(community_id);
CREATE INDEX IF NOT EXISTS idx_houses_status ON houses(status);

-- =============================================
-- 3. AGENTS / SOURCES
-- =============================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  source_platform TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. SOURCE LISTINGS
-- =============================================
CREATE TABLE IF NOT EXISTS source_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  source_url TEXT,
  source_listing_id TEXT,
  asking_price_usd DECIMAL(12, 2),
  asking_price_thb DECIMAL(14, 2),
  price_per_sqm_usd DECIMAL(10, 2),
  listing_date DATE,
  last_seen_date DATE,
  is_active BOOLEAN DEFAULT true,
  listing_description TEXT,
  listing_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for source listings
CREATE INDEX IF NOT EXISTS idx_source_listings_house_id ON source_listings(house_id);
CREATE INDEX IF NOT EXISTS idx_source_listings_agent_id ON source_listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_source_listings_is_active ON source_listings(is_active);

-- =============================================
-- 5. PRICE HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_listing_id UUID NOT NULL REFERENCES source_listings(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  price_usd DECIMAL(12, 2) NOT NULL,
  price_thb DECIMAL(14, 2),
  price_per_sqm_usd DECIMAL(10, 2),
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  change_type TEXT DEFAULT 'initial' CHECK (change_type IN ('initial', 'increase', 'decrease', 'no_change')),
  change_amount_usd DECIMAL(12, 2),
  change_percentage DECIMAL(6, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for price history
CREATE INDEX IF NOT EXISTS idx_price_history_source_listing_id ON price_history(source_listing_id);
CREATE INDEX IF NOT EXISTS idx_price_history_house_id ON price_history(house_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_date ON price_history(recorded_date);

-- =============================================
-- 6. VERIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'disputed', 'pending')),
  verification_date TIMESTAMPTZ,
  verified_by TEXT,
  verification_method TEXT CHECK (verification_method IN ('manual', 'automated', 'community', 'agent')),
  evidence_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for verifications
CREATE INDEX IF NOT EXISTS idx_verifications_house_id ON verifications(house_id);

-- =============================================
-- 7. DUPLICATE REVIEWS
-- =============================================
CREATE TABLE IF NOT EXISTS duplicate_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id_a UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  house_id_b UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  match_score DECIMAL(3, 2) DEFAULT 0.00,
  match_reasons TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed_duplicate', 'not_duplicate')),
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate review pairs
  UNIQUE(house_id_a, house_id_b),
  -- Ensure we don't compare a house with itself
  CHECK (house_id_a != house_id_b)
);

-- =============================================
-- ROW LEVEL SECURITY (Basic - Allow all for now)
-- =============================================
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_reviews ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read access on communities" ON communities FOR SELECT USING (true);
CREATE POLICY "Allow public read access on houses" ON houses FOR SELECT USING (true);
CREATE POLICY "Allow public read access on agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Allow public read access on source_listings" ON source_listings FOR SELECT USING (true);
CREATE POLICY "Allow public read access on price_history" ON price_history FOR SELECT USING (true);
CREATE POLICY "Allow public read access on verifications" ON verifications FOR SELECT USING (true);
CREATE POLICY "Allow public read access on duplicate_reviews" ON duplicate_reviews FOR SELECT USING (true);

-- Admin write access policies (using anon key for prototype - will be secured later)
CREATE POLICY "Allow insert on communities" ON communities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on communities" ON communities FOR UPDATE USING (true);
CREATE POLICY "Allow delete on communities" ON communities FOR DELETE USING (true);

CREATE POLICY "Allow insert on houses" ON houses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on houses" ON houses FOR UPDATE USING (true);
CREATE POLICY "Allow delete on houses" ON houses FOR DELETE USING (true);

CREATE POLICY "Allow insert on agents" ON agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on agents" ON agents FOR UPDATE USING (true);
CREATE POLICY "Allow delete on agents" ON agents FOR DELETE USING (true);

CREATE POLICY "Allow insert on source_listings" ON source_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on source_listings" ON source_listings FOR UPDATE USING (true);
CREATE POLICY "Allow delete on source_listings" ON source_listings FOR DELETE USING (true);

CREATE POLICY "Allow insert on price_history" ON price_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on price_history" ON price_history FOR UPDATE USING (true);
CREATE POLICY "Allow delete on price_history" ON price_history FOR DELETE USING (true);

CREATE POLICY "Allow insert on verifications" ON verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on verifications" ON verifications FOR UPDATE USING (true);
CREATE POLICY "Allow delete on verifications" ON verifications FOR DELETE USING (true);

CREATE POLICY "Allow insert on duplicate_reviews" ON duplicate_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on duplicate_reviews" ON duplicate_reviews FOR UPDATE USING (true);
CREATE POLICY "Allow delete on duplicate_reviews" ON duplicate_reviews FOR DELETE USING (true);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_houses_updated_at BEFORE UPDATE ON houses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_source_listings_updated_at BEFORE UPDATE ON source_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROLE PRIVILEGES (Ensure anon/authenticated access)
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
