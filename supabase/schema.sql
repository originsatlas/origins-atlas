-- ============================================================================
-- Origins Atlas — Consolidated Database Schema
-- Technical Foundation & Security Hardened
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor for fresh database setup
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. COMMUNITIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  location TEXT,
  city TEXT,
  province TEXT CHECK (province IS NULL OR province IN (
    'Bangkok', 'Samut Prakan', 'Nonthaburi', 'Pathum Thani',
    'Chonburi', 'Phuket', 'Chiang Mai', 'Hua Hin', 'Rayong', 'Other'
  )),
  country TEXT DEFAULT 'TH',
  total_units INT,
  community_type TEXT DEFAULT 'gated_community' CHECK (community_type IN (
    'gated_community', 'residential_estate', 'luxury_resort', 'condominium', 'village'
  )),
  amenities TEXT[] DEFAULT '{}',
  image_url TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  -- Soft Delete & Audit Tracking
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_by TEXT DEFAULT 'system',
  updated_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_is_archived ON communities(is_archived);

-- ============================================================================
-- 2. HOUSES (Canonical Physical Property)
-- ============================================================================
CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  house_number TEXT,
  address TEXT,
  property_type TEXT DEFAULT 'detached_house' CHECK (property_type IN (
    'detached_house', 'semi_detached', 'townhouse', 'luxury_villa', 'penthouse', 'condo'
  )),
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
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'unlisted', 'pending_review', 'archived')),
  is_new_listing BOOLEAN DEFAULT true,
  has_price_reduction BOOLEAN DEFAULT false,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  -- Soft Delete & Audit Tracking
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_by TEXT DEFAULT 'system',
  updated_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Unique constraint for duplicate prevention (when house_number is known)
  UNIQUE(community_id, house_number)
);

CREATE INDEX IF NOT EXISTS idx_houses_community_id ON houses(community_id);
CREATE INDEX IF NOT EXISTS idx_houses_status ON houses(status);
CREATE INDEX IF NOT EXISTS idx_houses_is_archived ON houses(is_archived);

-- ============================================================================
-- 3. AGENTS / SOURCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  source_platform TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  -- Soft Delete & Audit Tracking
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_by TEXT DEFAULT 'system',
  updated_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_is_archived ON agents(is_archived);

-- ============================================================================
-- 4. SOURCE LISTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS source_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  source_url TEXT,
  source_listing_id TEXT,
  asking_price_thb DECIMAL(14, 2), -- Primary source price
  asking_price_usd DECIMAL(12, 2), -- Derived USD price
  price_per_sqm_thb DECIMAL(12, 2),
  price_per_sqm_usd DECIMAL(10, 2),
  listing_date DATE,
  last_seen_date DATE,
  is_active BOOLEAN DEFAULT true,
  listing_description TEXT,
  listing_images TEXT[] DEFAULT '{}',
  -- Soft Delete & Audit Tracking
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_by TEXT DEFAULT 'system',
  updated_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_source_listings_house_id ON source_listings(house_id);
CREATE INDEX IF NOT EXISTS idx_source_listings_agent_id ON source_listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_source_listings_is_active ON source_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_source_listings_is_archived ON source_listings(is_archived);

-- ============================================================================
-- 5. PRICE HISTORY (Append-Only & Immutable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_listing_id UUID NOT NULL REFERENCES source_listings(id) ON DELETE CASCADE,
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  price_thb DECIMAL(14, 2) NOT NULL, -- Primary currency
  price_usd DECIMAL(12, 2) NOT NULL, -- Derived currency
  price_per_sqm_thb DECIMAL(12, 2),
  price_per_sqm_usd DECIMAL(10, 2),
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  change_type TEXT DEFAULT 'initial' CHECK (change_type IN ('initial', 'increase', 'decrease', 'no_change')),
  change_amount_thb DECIMAL(14, 2),
  change_amount_usd DECIMAL(12, 2),
  change_percentage DECIMAL(6, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_source_listing_id ON price_history(source_listing_id);
CREATE INDEX IF NOT EXISTS idx_price_history_house_id ON price_history(house_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_date ON price_history(recorded_date);

-- ============================================================================
-- 6. VERIFICATIONS
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_verifications_house_id ON verifications(house_id);

-- ============================================================================
-- 7. DUPLICATE REVIEWS
-- ============================================================================
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
  UNIQUE(house_id_a, house_id_b),
  CHECK (house_id_a != house_id_b)
);

-- ============================================================================
-- 8. AUDIT LOGS (Change Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'ARCHIVE', 'RESTORE')),
  changed_by TEXT DEFAULT 'admin',
  old_values JSONB,
  new_values JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- AUTOMATED TRIGGERS
-- ============================================================================

-- 1. updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_houses_updated_at BEFORE UPDATE ON houses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_source_listings_updated_at BEFORE UPDATE ON source_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Append-only immutability trigger for price_history
CREATE OR REPLACE FUNCTION prevent_price_history_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'SAFETY VIOLATION: price_history records are immutable audit logs and cannot be updated.';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'SAFETY VIOLATION: price_history records are permanent and cannot be deleted.';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_price_history_modification ON price_history;
CREATE TRIGGER trg_prevent_price_history_modification
BEFORE UPDATE OR DELETE ON price_history
FOR EACH ROW EXECUTE FUNCTION prevent_price_history_modification();

-- 3. Automated price history logging on source_listings price change
CREATE OR REPLACE FUNCTION record_listing_price_change()
RETURNS TRIGGER AS $$
DECLARE
  v_diff_thb DECIMAL(14, 2);
  v_pct DECIMAL(6, 2);
  v_change_type TEXT;
  v_exchange_rate DECIMAL(10, 4) := 0.0271;
  v_derived_usd DECIMAL(12, 2);
BEGIN
  IF NEW.asking_price_thb IS NOT NULL AND NEW.asking_price_usd IS NULL THEN
    NEW.asking_price_usd := ROUND(NEW.asking_price_thb * v_exchange_rate, 2);
  END IF;

  v_derived_usd := COALESCE(NEW.asking_price_usd, ROUND(COALESCE(NEW.asking_price_thb, 0) * v_exchange_rate, 2));

  IF TG_OP = 'INSERT' THEN
    IF NEW.asking_price_thb IS NOT NULL OR NEW.asking_price_usd IS NOT NULL THEN
      INSERT INTO price_history (
        source_listing_id, house_id, price_thb, price_usd, price_per_sqm_usd,
        recorded_date, change_type, change_amount_usd, change_amount_thb, change_percentage, notes
      ) VALUES (
        NEW.id, NEW.house_id,
        COALESCE(NEW.asking_price_thb, ROUND(NEW.asking_price_usd / v_exchange_rate, 2)),
        v_derived_usd,
        NEW.price_per_sqm_usd,
        CURRENT_DATE, 'initial', 0.00, 0.00, 0.00,
        'Initial recorded listing price'
      );
    END IF;

  ELSIF TG_OP = 'UPDATE' AND (OLD.asking_price_thb IS DISTINCT FROM NEW.asking_price_thb OR OLD.asking_price_usd IS DISTINCT FROM NEW.asking_price_usd) THEN
    IF NEW.asking_price_thb IS NOT NULL AND OLD.asking_price_thb IS NOT NULL THEN
      v_diff_thb := NEW.asking_price_thb - OLD.asking_price_thb;
      IF OLD.asking_price_thb > 0 THEN
        v_pct := ROUND((v_diff_thb / OLD.asking_price_thb) * 100, 2);
      ELSE
        v_pct := 0.00;
      END IF;
    ELSE
      v_diff_thb := ROUND((COALESCE(NEW.asking_price_usd, 0) - COALESCE(OLD.asking_price_usd, 0)) / v_exchange_rate, 2);
      IF COALESCE(OLD.asking_price_usd, 0) > 0 THEN
        v_pct := ROUND(((COALESCE(NEW.asking_price_usd, 0) - OLD.asking_price_usd) / OLD.asking_price_usd) * 100, 2);
      ELSE
        v_pct := 0.00;
      END IF;
    END IF;

    IF v_diff_thb < 0 THEN
      v_change_type := 'decrease';
      UPDATE houses SET has_price_reduction = true, updated_at = NOW() WHERE id = NEW.house_id;
    ELSIF v_diff_thb > 0 THEN
      v_change_type := 'increase';
    ELSE
      v_change_type := 'no_change';
    END IF;

    INSERT INTO price_history (
      source_listing_id, house_id, price_thb, price_usd, price_per_sqm_usd,
      recorded_date, change_type, change_amount_usd, change_amount_thb, change_percentage, notes
    ) VALUES (
      NEW.id, NEW.house_id,
      COALESCE(NEW.asking_price_thb, ROUND(NEW.asking_price_usd / v_exchange_rate, 2)),
      v_derived_usd,
      NEW.price_per_sqm_usd,
      CURRENT_DATE, v_change_type,
      ROUND(v_diff_thb * v_exchange_rate, 2),
      v_diff_thb,
      v_pct,
      'Automated price adjustment record'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_record_listing_price_change ON source_listings;
CREATE TRIGGER trg_record_listing_price_change
AFTER INSERT OR UPDATE OF asking_price_thb, asking_price_usd ON source_listings
FOR EACH ROW EXECUTE FUNCTION record_listing_price_change();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policies (Only SELECT permitted for public users)
CREATE POLICY "Allow public read on communities" ON communities FOR SELECT USING (true);
CREATE POLICY "Allow public read on houses" ON houses FOR SELECT USING (true);
CREATE POLICY "Allow public read on agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Allow public read on source_listings" ON source_listings FOR SELECT USING (true);
CREATE POLICY "Allow public read on price_history" ON price_history FOR SELECT USING (true);
CREATE POLICY "Allow public read on verifications" ON verifications FOR SELECT USING (true);
CREATE POLICY "Allow public read on duplicate_reviews" ON duplicate_reviews FOR SELECT USING (true);
CREATE POLICY "Allow public read on audit_logs" ON audit_logs FOR SELECT USING (true);

-- 2. Admin Write Policies (Strictly restricted to service_role)
CREATE POLICY "Admin write on communities" ON communities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admin write on houses" ON houses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admin write on agents" ON agents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admin write on source_listings" ON source_listings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admin write on price_history" ON price_history FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Admin write on verifications" ON verifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admin write on duplicate_reviews" ON duplicate_reviews FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admin write on audit_logs" ON audit_logs FOR INSERT TO service_role WITH CHECK (true);

-- ============================================================================
-- ROLE PRIVILEGES: LOCK DOWN PUBLIC & AUTHENTICATED WRITES
-- ============================================================================
-- anon & authenticated roles: Strictly USAGE on schema and SELECT on tables. ZERO direct write permissions.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- service_role: Full administrative management access for backend API routes
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Ensure future tables default to secure read-only for anon and authenticated
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
