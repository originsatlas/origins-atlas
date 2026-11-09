-- ============================================================================
-- Migration: 20261109000001_security_and_foundation.sql
-- Project: Origins Atlas
-- Description: Stage 1 Foundation & Security Hardening:
--   1. Lock down DB writes: Revoke INSERT/UPDATE/DELETE from anon role
--   2. Standardize property types, community types, provinces, and statuses
--   3. Append-only, reliable Price History with THB as primary currency
--   4. Audit / Change tracking table and triggers
--   5. Soft-delete / Archive mechanism across core tables
-- ============================================================================

-- ============================================================================
-- 1. LOCK DOWN DATABASE WRITES: REVOKE PUBLIC WRITE ACCESS
-- The anon role is strictly read-only (SELECT).
-- Writes are reserved exclusively for service_role and authenticated roles.
-- ============================================================================
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role, authenticated;

-- Ensure newly created tables in public schema default to read-only for anon
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE INSERT, UPDATE, DELETE ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role, authenticated;

-- ============================================================================
-- 2. STANDARDIZED ENUMS & DOMAIN CONSTRAINTS
-- Prevent free-text fragmentation for property categories, community types,
-- provinces, and listing statuses.
-- ============================================================================

-- Add or update CHECK constraints on communities
ALTER TABLE communities DROP CONSTRAINT IF EXISTS chk_communities_province;
ALTER TABLE communities ADD CONSTRAINT chk_communities_province
  CHECK (province IS NULL OR province IN (
    'Bangkok', 'Samut Prakan', 'Nonthaburi', 'Pathum Thani',
    'Chonburi', 'Phuket', 'Chiang Mai', 'Hua Hin', 'Rayong', 'Other'
  ));

ALTER TABLE communities DROP CONSTRAINT IF EXISTS chk_communities_type;
ALTER TABLE communities ADD CONSTRAINT chk_communities_type
  CHECK (community_type IN (
    'gated_community', 'residential_estate', 'luxury_resort', 'condominium', 'village'
  ));

-- Add or update CHECK constraints on houses
ALTER TABLE houses DROP CONSTRAINT IF EXISTS chk_houses_property_type;
ALTER TABLE houses ADD CONSTRAINT chk_houses_property_type
  CHECK (property_type IN (
    'detached_house', 'semi_detached', 'townhouse', 'luxury_villa', 'penthouse', 'condo'
  ));

ALTER TABLE houses DROP CONSTRAINT IF EXISTS houses_status_check;
ALTER TABLE houses ADD CONSTRAINT houses_status_check
  CHECK (status IN ('active', 'sold', 'unlisted', 'pending_review', 'archived'));

-- ============================================================================
-- 3. SOFT-DELETE / ARCHIVE SUPPORT
-- Add is_archived, archived_at, and archived_by to core entities.
-- Prevents permanent loss of canonical records and historical data.
-- ============================================================================
ALTER TABLE communities ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS archived_by TEXT;

ALTER TABLE houses ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS archived_by TEXT;

ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS archived_by TEXT;

ALTER TABLE source_listings ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE source_listings ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE source_listings ADD COLUMN IF NOT EXISTS archived_by TEXT;

-- Indexes for active (un-archived) filtering
CREATE INDEX IF NOT EXISTS idx_communities_is_archived ON communities(is_archived);
CREATE INDEX IF NOT EXISTS idx_houses_is_archived ON houses(is_archived);
CREATE INDEX IF NOT EXISTS idx_agents_is_archived ON agents(is_archived);
CREATE INDEX IF NOT EXISTS idx_source_listings_is_archived ON source_listings(is_archived);

-- ============================================================================
-- 4. AUDIT & CHANGE TRACKING
-- Tracks who modified records, old vs new values, and timestamps.
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

-- Add audit attribution columns on mutable tables
ALTER TABLE communities ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT 'system';

ALTER TABLE houses ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';
ALTER TABLE houses ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT 'system';

ALTER TABLE agents ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT 'system';

ALTER TABLE source_listings ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';
ALTER TABLE source_listings ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT 'system';

-- ============================================================================
-- 5. RELIABLE, APPEND-ONLY PRICE HISTORY (THB PRIMARY, USD DERIVED)
-- Ensure price_history records can never be updated or deleted.
-- ============================================================================

-- Ensure THB columns exist and are prioritized
ALTER TABLE source_listings ADD COLUMN IF NOT EXISTS price_per_sqm_thb DECIMAL(12, 2);
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS price_per_sqm_thb DECIMAL(12, 2);
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS change_amount_thb DECIMAL(14, 2);

-- Immutability trigger on price_history: strictly APPEND-ONLY
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

-- Automated Price History Logger on source_listings
CREATE OR REPLACE FUNCTION record_listing_price_change()
RETURNS TRIGGER AS $$
DECLARE
  v_diff_thb DECIMAL(14, 2);
  v_pct DECIMAL(6, 2);
  v_change_type TEXT;
  v_exchange_rate DECIMAL(10, 4) := 0.0271; -- Default THB to USD conversion factor
  v_derived_usd DECIMAL(12, 2);
BEGIN
  -- Compute derived USD if not explicitly supplied
  IF NEW.asking_price_thb IS NOT NULL AND NEW.asking_price_usd IS NULL THEN
    NEW.asking_price_usd := ROUND(NEW.asking_price_thb * v_exchange_rate, 2);
  END IF;

  v_derived_usd := COALESCE(NEW.asking_price_usd, ROUND(COALESCE(NEW.asking_price_thb, 0) * v_exchange_rate, 2));

  IF TG_OP = 'INSERT' THEN
    -- Only log if price is provided
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
    -- Calculate difference using THB if available, otherwise USD
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
      -- Automatically set price reduction flag on canonical house
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
-- 6. UPDATED ROW LEVEL SECURITY (RLS) POLICIES
-- Clean, strict separation between public read-only and admin writes.
-- ============================================================================

-- Drop old prototype write policies that allowed anon to write
DROP POLICY IF EXISTS "Allow insert on communities" ON communities;
DROP POLICY IF EXISTS "Allow update on communities" ON communities;
DROP POLICY IF EXISTS "Allow delete on communities" ON communities;

DROP POLICY IF EXISTS "Allow insert on houses" ON houses;
DROP POLICY IF EXISTS "Allow update on houses" ON houses;
DROP POLICY IF EXISTS "Allow delete on houses" ON houses;

DROP POLICY IF EXISTS "Allow insert on agents" ON agents;
DROP POLICY IF EXISTS "Allow update on agents" ON agents;
DROP POLICY IF EXISTS "Allow delete on agents" ON agents;

DROP POLICY IF EXISTS "Allow insert on source_listings" ON source_listings;
DROP POLICY IF EXISTS "Allow update on source_listings" ON source_listings;
DROP POLICY IF EXISTS "Allow delete on source_listings" ON source_listings;

DROP POLICY IF EXISTS "Allow insert on price_history" ON price_history;
DROP POLICY IF EXISTS "Allow update on price_history" ON price_history;
DROP POLICY IF EXISTS "Allow delete on price_history" ON price_history;

DROP POLICY IF EXISTS "Allow insert on verifications" ON verifications;
DROP POLICY IF EXISTS "Allow update on verifications" ON verifications;
DROP POLICY IF EXISTS "Allow delete on verifications" ON verifications;

DROP POLICY IF EXISTS "Allow insert on duplicate_reviews" ON duplicate_reviews;
DROP POLICY IF EXISTS "Allow update on duplicate_reviews" ON duplicate_reviews;
DROP POLICY IF EXISTS "Allow delete on duplicate_reviews" ON duplicate_reviews;

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Read policies: public access (excluding archived records for public, full for admin)
CREATE POLICY "Allow public read on audit_logs" ON audit_logs FOR SELECT USING (true);

-- Admin write policies: restricted strictly to authenticated users and service_role
CREATE POLICY "Admin write on communities" ON communities
  FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admin write on houses" ON houses
  FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admin write on agents" ON agents
  FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admin write on source_listings" ON source_listings
  FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admin write on price_history" ON price_history
  FOR INSERT TO authenticated, service_role WITH CHECK (true);

CREATE POLICY "Admin write on verifications" ON verifications
  FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admin write on duplicate_reviews" ON duplicate_reviews
  FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admin write on audit_logs" ON audit_logs
  FOR INSERT TO authenticated, service_role WITH CHECK (true);
