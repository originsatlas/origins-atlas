# Origins Atlas — Luxury Real Estate Intelligence Platform

Origins Atlas is the authoritative single source of truth for master-planned communities and luxury residential developments in Southeast Asia, beginning with Bangkok, Thailand.

---

## Technical Documentation & Architecture Review

- **[Technical Architecture & Database Specification](./TECHNICAL_ARCHITECTURE.md)**: Full architecture review guide, ERD diagram, canonical property deduplication model, security architecture, and testing instructions.
- **[Database Migrations](./supabase/migrations/README.md)**: Sequential version-controlled migrations for Supabase/PostgreSQL.
- **[Schema Export](./supabase/schema.sql)**: Complete PostgreSQL DDL export.
- **[Seed Dataset](./supabase/seed.sql)**: Realistic Thai real estate prototype seed data.

---

## Core Entities & Relational Model

Origins Atlas introduces the **"One Physical House, Many Broker Listings"** architecture:
- **`communities`**: Master residential developments (e.g., *Nirvana Absolute Bangna*).
- **`houses`**: Canonical physical units with permanent specifications, floor plans, and coordinates.
- **`agents`**: Directory of brokers and agencies (e.g., *108Siam*, *PropertyScout*, *Connex Property*, *Agentplus*).
- **`source_listings`**: Broker listings across portals pointing to canonical physical houses.
- **`price_history`**: Immutable time-series audit trail of asking price fluctuations.
- **`verifications`**: Cadastral, title deed, and site inspection records.
- **`duplicate_reviews`**: Algorithmic queue for resolving cross-broker duplicate listings.

---

## Getting Started Locally

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- A Supabase PostgreSQL database

### 2. Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Fill in your Supabase project credentials and admin authentication keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

ADMIN_EMAIL=admin@originsatlas.com
ADMIN_PASSWORD=<your-admin-password>
ADMIN_SESSION_SECRET=<32-char-random-secret>
```

### 3. Database Setup
Apply migrations using either:
```bash
supabase db push
# or run supabase/schema.sql and supabase/seed.sql in the Supabase SQL Editor
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the public portal, or [http://localhost:3000/admin](http://localhost:3000/admin) for the admin portal.

---

## Admin Portal & Test Access

The administrative CMS (`/admin`) is guarded by an Edge Proxy middleware using stateless Web Crypto HMAC-SHA256 session tokens.

- **Login URL:** `/admin/login`
- **Default Prototype Admin Email:** `admin@originsatlas.com`
- **Default Prototype Admin Password:** `OriginsAtlas2026!`
