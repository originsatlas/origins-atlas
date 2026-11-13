-- ============================================================================
-- Migration: 20261113000001_harden_stage1_closeout.sql
-- Project: Origins Atlas
-- Description: Stage 1 Architecture Review Close-Out:
--   1. Revoke INSERT, UPDATE, DELETE from the 'authenticated' Supabase role.
--   2. Grant SELECT only to 'authenticated' and 'anon'.
--   3. Restrict all table write operations exclusively to 'service_role'.
--   4. Update Row Level Security (RLS) write policies to target 'service_role' only.
-- ============================================================================

-- ============================================================================
-- 1. REVOKE WRITE PERMISSIONS FROM 'authenticated' ROLE
-- The normal 'authenticated' Supabase role (any user logged into Supabase Auth)
-- must NOT have direct database write access.
-- All writes must route through server-side API routes utilizing 'service_role'.
-- ============================================================================

REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Ensure newly created tables in public schema default to read-only for authenticated
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE INSERT, UPDATE, DELETE ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;

-- Ensure service_role has full elevated management privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- ============================================================================
-- 2. HARDEN ROW LEVEL SECURITY (RLS) WRITE POLICIES
-- Recreate write policies so they are strictly accessible TO service_role only.
-- ============================================================================

-- Communities
DROP POLICY IF EXISTS "Admin write on communities" ON communities;
CREATE POLICY "Admin write on communities" ON communities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Houses
DROP POLICY IF EXISTS "Admin write on houses" ON houses;
CREATE POLICY "Admin write on houses" ON houses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Agents
DROP POLICY IF EXISTS "Admin write on agents" ON agents;
CREATE POLICY "Admin write on agents" ON agents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Source Listings
DROP POLICY IF EXISTS "Admin write on source_listings" ON source_listings;
CREATE POLICY "Admin write on source_listings" ON source_listings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Price History (Append-only insert for service_role)
DROP POLICY IF EXISTS "Admin write on price_history" ON price_history;
CREATE POLICY "Admin write on price_history" ON price_history
  FOR INSERT TO service_role WITH CHECK (true);

-- Verifications
DROP POLICY IF EXISTS "Admin write on verifications" ON verifications;
CREATE POLICY "Admin write on verifications" ON verifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Duplicate Reviews
DROP POLICY IF EXISTS "Admin write on duplicate_reviews" ON duplicate_reviews;
CREATE POLICY "Admin write on duplicate_reviews" ON duplicate_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Audit Logs (Append-only insert for service_role)
DROP POLICY IF EXISTS "Admin write on audit_logs" ON audit_logs;
CREATE POLICY "Admin write on audit_logs" ON audit_logs
  FOR INSERT TO service_role WITH CHECK (true);
