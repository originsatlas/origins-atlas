# Origins Atlas — Technical Architecture & Database Specification
**Document Version:** 1.2.0 (Stage 1 Architecture Review Close-Out)  
**Target Audience:** Independent Technical Architecture Reviewers & Engineering Stakeholders  
**Scope:** Stage 1 Security & Data-Protection Hardening (Complete)

---

## 1. Executive Summary

Origins Atlas is a specialized luxury real estate intelligence platform designed to serve as the **authoritative single source of truth** for master-planned communities and high-end residential developments in Southeast Asia, beginning with Bangkok, Thailand.

In emerging and high-growth property markets across Southeast Asia, property data is notoriously fragmented. Multiple independent agencies, aggregators, and freelance brokers re-list the identical physical property across portals (Hipflat, DDproperty, FazWaz, DotProperty) with disparate price points, inconsistent descriptions, inaccurate coordinates, and stale availability.

Origins Atlas solves this fundamental market failure through an architectural paradigm centered on **Canonical Physical Entities**:
- **Communities** define the master-planned real estate development.
- **Houses** represent unique, permanent physical structures in the physical world (identified by plot, cadastral boundaries, and house numbers).
- **Source Listings** capture ephemeral broker listings across competing agencies, mapping multiple independent agency offerings back to one physical house.
- **Price History** maintains an immutable audit trail of price changes across agencies and canonical properties.
- **Duplicate Reviews** and **Verifications** ensure data integrity through algorithmic heuristics and verifiable ground truth.

---

## 2. Visual Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    COMMUNITIES ||--o{ HOUSES : "contains (1:N)"
    HOUSES ||--o{ SOURCE_LISTINGS : "mapped to (1:N)"
    AGENTS ||--o{ SOURCE_LISTINGS : "publishes (1:N)"
    SOURCE_LISTINGS ||--o{ PRICE_HISTORY : "tracks (1:N)"
    HOUSES ||--o{ PRICE_HISTORY : "aggregated on (1:N)"
    HOUSES ||--o{ VERIFICATIONS : "validated by (1:N)"
    HOUSES ||--o{ DUPLICATE_REVIEWS : "candidate A (1:N)"
    HOUSES ||--o{ DUPLICATE_REVIEWS : "candidate B (1:N)"

    COMMUNITIES {
        UUID id PK
        TEXT name
        TEXT slug UK
        TEXT description
        TEXT location
        TEXT city
        TEXT province
        TEXT country
        INT total_units
        TEXT community_type
        TEXT_ARRAY amenities
        TEXT image_url
        DECIMAL latitude
        DECIMAL longitude
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    HOUSES {
        UUID id PK
        UUID community_id FK
        TEXT house_number
        TEXT address
        TEXT property_type
        INT bedrooms
        INT bathrooms
        INT parking_spaces
        DECIMAL house_size_sqm
        DECIMAL land_size_sqm
        INT floors
        INT year_built
        TEXT_ARRAY features
        TEXT description
        TEXT main_image_url
        TEXT_ARRAY image_urls
        TEXT status
        BOOLEAN is_new_listing
        BOOLEAN has_price_reduction
        DECIMAL latitude
        DECIMAL longitude
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    AGENTS {
        UUID id PK
        TEXT name
        TEXT source_platform
        TEXT contact_email
        TEXT contact_phone
        TEXT website_url
        TEXT logo_url
        BOOLEAN is_verified
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    SOURCE_LISTINGS {
        UUID id PK
        UUID house_id FK
        UUID agent_id FK
        TEXT source_url
        TEXT source_listing_id
        DECIMAL asking_price_usd
        DECIMAL asking_price_thb
        DECIMAL price_per_sqm_usd
        DATE listing_date
        DATE last_seen_date
        BOOLEAN is_active
        TEXT listing_description
        TEXT_ARRAY listing_images
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    PRICE_HISTORY {
        UUID id PK
        UUID source_listing_id FK
        UUID house_id FK
        DECIMAL price_usd
        DECIMAL price_thb
        DECIMAL price_per_sqm_usd
        DATE recorded_date
        TEXT change_type
        DECIMAL change_amount_usd
        DECIMAL change_percentage
        TEXT notes
        TIMESTAMPTZ created_at
    }

    VERIFICATIONS {
        UUID id PK
        UUID house_id FK
        TEXT verification_status
        TIMESTAMPTZ verification_date
        TEXT verified_by
        TEXT verification_method
        TEXT evidence_url
        TEXT notes
        TIMESTAMPTZ created_at
    }

    DUPLICATE_REVIEWS {
        UUID id PK
        UUID house_id_a FK
        UUID house_id_b FK
        DECIMAL match_score
        TEXT_ARRAY match_reasons
        TEXT status
        TEXT resolved_by
        TIMESTAMPTZ resolved_at
        TEXT notes
        TIMESTAMPTZ created_at
    }
```

---

## 3. Database Schema & Data Dictionary

The database is built on **PostgreSQL 15+** managed via **Supabase**. All primary keys utilize standard UUIDv4 types (`uuid-ossp`).

### 3.1. Tables Overview

| Table Name | Description | Key Constraints & Indexes |
|---|---|---|
| `communities` | Master residential developments / gated projects. | `PRIMARY KEY (id)`, `UNIQUE(slug)`. |
| `houses` | The canonical physical real estate units. | `PRIMARY KEY (id)`, `FOREIGN KEY (community_id) ON DELETE CASCADE`, `UNIQUE(community_id, house_number)`, Indexes on `community_id`, `status`. |
| `agents` | Brokers, real estate agencies, and scraping sources. | `PRIMARY KEY (id)`. |
| `source_listings` | Broker-published listing instances across platforms. | `PRIMARY KEY (id)`, `FOREIGN KEY (house_id) ON DELETE CASCADE`, `FOREIGN KEY (agent_id) ON DELETE CASCADE`, Indexes on `house_id`, `agent_id`, `is_active`. |
| `price_history` | Time-series log of price adjustments. | `PRIMARY KEY (id)`, `FOREIGN KEY (source_listing_id) ON DELETE CASCADE`, `FOREIGN KEY (house_id) ON DELETE CASCADE`, Indexes on `source_listing_id`, `house_id`, `recorded_date`. |
| `verifications` | Audit records verifying house details, titles, and site visits. | `PRIMARY KEY (id)`, `FOREIGN KEY (house_id) ON DELETE CASCADE`, Index on `house_id`. |
| `duplicate_reviews` | Queue for suspected duplicate listings awaiting resolution. | `PRIMARY KEY (id)`, `FOREIGN KEY (house_id_a) ON DELETE CASCADE`, `FOREIGN KEY (house_id_b) ON DELETE CASCADE`, `UNIQUE(house_id_a, house_id_b)`, `CHECK (house_id_a != house_id_b)`. |

### 3.2. Automated Triggers & Maintenance
To prevent manual drift in timestamps, an automated PostgreSQL trigger (`update_updated_at_column()`) is attached to all mutable tables (`communities`, `houses`, `agents`, `source_listings`):

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
```

### 3.3. Security & Access Model (RLS)
The database enforces **Row Level Security (RLS)**:
- **Public (Anon/Authenticated):** Read access (`SELECT`) is granted across all public tables (`communities`, `houses`, `agents`, `source_listings`, `price_history`, `verifications`, `duplicate_reviews`).
- **Prototype Admin Layer:** Prototype write operations (`INSERT`, `UPDATE`, `DELETE`) are accessible through the web administration interface, which is gated by a secure Edge Proxy authentication layer.

---

## 4. Key Architectural Patterns

### 4.1. "One Physical House, Many Broker Listings"
In conventional real estate portals, each broker's listing is treated as an independent listing row. When 4 brokers list the same villa in Nirvana Absolute Bangna, the user sees 4 repetitive cards with conflicting details.

In Origins Atlas:
1. `houses` represents the immutable physical unit (e.g. Unit `88/12`).
2. Multiple brokers (`108Siam`, `PropertyScout`, etc.) each have an entry in `source_listings` pointing to that same `house_id`.
3. The public UI surfaces the consolidated canonical house, displaying:
   - Lowest current asking price among verified brokers.
   - Comprehensive broker comparison table showing who has listed it, their asking price, and original listing links.
   - Complete price history revealing if any broker recently discounted the asking price.

### 4.2. Immutable Price Tracking
Whenever a source listing is refreshed or edited:
- If `asking_price_usd` differs from the latest record, a new row is appended to `price_history`.
- `change_type` classifies the event (`initial`, `increase`, `decrease`, `no_change`).
- `change_amount_usd` and `change_percentage` are computed.
- The parent canonical `houses` record updates `has_price_reduction = true` if any active listing dropped in price.

### 4.3. Duplicate Detection & Reconciliation Engine
The `duplicate_reviews` table maintains potential duplicates detected via matching heuristics:
- Matching community (`community_id`).
- Identical or near-identical living area (`house_size_sqm` ± 5%).
- Identical bedroom and bathroom count.
- Closely clustered asking prices.
Admins can review candidate pairs side-by-side in `/admin/duplicates` and mark them as `confirmed_duplicate` (triggering an association merge) or `not_duplicate`.

---

## 5. Technology Stack & Implementation

```
┌────────────────────────────────────────────────────────┐
│                   Next.js 16 (App Router)              │
│       React 19 Server & Client Components + Turbopack   │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│     Public Portal       │ │       Admin CMS         │
│  - Community Directory  │ │  - Edge Proxy Auth      │
│  - Canonical Explorer   │ │  - Web Crypto HMAC      │
│  - Price History Charts │ │  - Full CRUD Modals     │
│  - Responsive Map View  │ │  - Deduplication Queue  │
└────────────┬────────────┘ └────────────┬────────────┘
             │                           │
             └─────────────┬─────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│            Supabase / PostgreSQL 15+ Engine            │
│  - Relational Schema with Foreign Key Cascades         │
│  - PostgreSQL Full-Text & Geospatial Indices           │
│  - Automated PL/pgSQL Timestamp Triggers               │
│  - Row Level Security (RLS) Enablement                 │
└────────────────────────────────────────────────────────┘
```

- **Framework:** Next.js 16.3.6 (Turbopack, TypeScript, React 19).
- **Styling Architecture:** Custom luxury design system (`globals.css`) with obsidian/gold themes, glassmorphism, responsive navigation, and mobile drawer views.
- **Database:** Supabase PostgreSQL 15+.
- **Authentication & Security:** Hardened HMAC-SHA256 session token system built on Web Crypto API (`src/lib/auth.ts`). Supabase Auth fallback and default credentials/secrets have been completely removed; strictly requires environment configuration (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`). Validated at the edge via middleware.
- **Database Access Control (Strict Service-Role Isolation):** Both the public `anon` role and standard `authenticated` Supabase user roles are strictly read-only (`SELECT` only). All mutations execute exclusively via authenticated server API routes (`/api/admin/*`) utilizing the mandatory `SUPABASE_SERVICE_ROLE_KEY` with zero fallback to `anon`.
- **Data Integrity & Auditability:** Triggers guarantee append-only price history, automated change logging, and comprehensive audit tracking via `audit_logs`. Soft delete (`is_archived`) is the exclusive deletion model across all entities; hard-delete fallbacks have been removed.
- **Seed Safeguards:** Destructive TRUNCATE operations in seed scripts are fail-safe and strictly blocked unless explicit session environment approval is provided (`app.environment` in development/staging and `app.allow_destructive_reset = 'true'`).

---

## 6. Reviewer Test Credentials & Verification Guide

The reviewer has read-only architectural review scope and does **not** need Supabase master database credentials. The staging environment provides a fully interactive administrator interface to inspect, add, and edit records.

### 6.1. Staging Admin Configuration

Admin credentials are now securely managed via environment variables (no default credentials exist in source code):

| Parameter | Configuration Key | Notes |
|---|---|---|
| **Admin Login URL** | `https://[your-staging-url]/admin/login` (or `http://localhost:3000/admin/login`) | Protected route |
| **Email** | `ADMIN_EMAIL` | Set in deployment environment (.env) |
| **Password** | `ADMIN_PASSWORD` | Set in deployment environment (.env) |
| **Signing Secret** | `ADMIN_SESSION_SECRET` | 32+ character high-entropy key |
| **Service Role Key** | `SUPABASE_SERVICE_ROLE_KEY` | Server-side only; required for all admin mutations |
| **Session Lifetime** | 7 Days (Stateless `origins_admin_session` HttpOnly cookie) | Secure, SameSite=Lax |

### 6.2. Recommended Workflows for Reviewer Verification

1. **Dashboard Overview (`/admin`):**
   - Review top-level statistics (Total Communities, Canonical Houses, Active Source Listings, Verified Agents, Pending Duplicates).
   - Inspect dual-currency asking prices (THB primary, USD secondary).
   - Inspect quick-access cards and system status indicators.

2. **Communities Workflow (`/admin/communities`):**
   - View existing community (*Nirvana Absolute Bangna*).
   - Test the **"Add Community"** modal (`/admin/communities/new`) to observe validation, standardized province dropdowns, auto-slug generation, and array handling for amenities.
   - Inspect edit and archive operations with custom confirmation modal (`ArchiveButton`).

3. **Canonical Houses Workflow (`/admin/houses`):**
   - Inspect the canonical house units. Note the status flags (`active`, `pending_review`).
   - Test filtering by Community and Status.
   - Test the **"Add House"** workflow (`/admin/houses/new`) to see standardized property types, specifications, coordinates, and photo galleries.

4. **Agents & Brokers Directory (`/admin/agents`):**
   - Review registered agency entities (`108Siam`, `PropertyScout`, `Connex Property`, `Agentplus`).
   - Test adding a new broker source and verifying soft-delete archive support.

5. **Source Listings & Price History (`/admin/listings`):**
   - Inspect how external listings map between specific `houses` and `agents`.
   - Observe THB as primary pricing with real-time automated USD derivation.
   - Test modifying a listing's price: an append-only historical record is automatically generated in `price_history` by the PostgreSQL trigger.

6. **Duplicate Resolution Queue (`/admin/duplicates`):**
   - Review candidate duplicate pairs flagged between units.
   - Inspect match score and matching heuristic tags (`same_community`, `matching_price_point`, `identical_bedroom_count`).

---

## 7. Migration Files & Schema Export Reference

All database definition assets are organized sequentially within the project repository:
- **Sequential Migrations Directory:** [`supabase/migrations/`](./supabase/migrations/)
  - `20260926000001_initial_schema.sql` (Full relational DDL)
  - `20261002000001_seed_prototype_data.sql` (Protected seed data with strict whitelist guard)
  - `20261109000001_security_and_foundation.sql` (Stage 1 Security & Foundation migration: anon lockdown, soft delete, audit logging, price triggers, standard constraints)
  - `20261113000001_harden_stage1_closeout.sql` (Stage 1 Close-Out: authenticated write revocation, exclusive service_role write access, hardened RLS policies)
- **Standalone Schema DDL Export:** [`supabase/schema.sql`](./supabase/schema.sql)
- **Standalone Seed Data Export:** [`supabase/seed.sql`](./supabase/seed.sql) (includes strict fail-safe environment approval guard)
