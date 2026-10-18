# Origins Atlas — Database Migrations

This directory contains the sequential, version-controlled database migrations for Origins Atlas, designed for Supabase and PostgreSQL 15+.

## Migration Index

| Order | Migration File | Description |
|---|---|---|
| `01` | [`20260926000001_initial_schema.sql`](./20260926000001_initial_schema.sql) | Baseline DDL: Extensions (`uuid-ossp`), 7 core relational tables, indexes, cascading foreign keys, RLS policies, and `updated_at` automated triggers. |
| `02` | [`20261002000001_seed_prototype_data.sql`](./20261002000001_seed_prototype_data.sql) | Prototype seed data: Realistic Bangkok luxury community (*Nirvana Absolute Bangna*), 4 verified real estate agencies, 6 canonical house units, 8 external source listings, price history records, verifications, and duplicate review queue. |

---

## How to Apply Migrations

### Option 1: Via Supabase CLI (Recommended for Developers)
If you have the Supabase CLI installed:

```bash
# Link to your Supabase project (if not already linked)
supabase link --project-ref <your-project-ref>

# Apply all pending migrations to your database
supabase db push
```

Or for a local Supabase Docker development environment:
```bash
supabase start
supabase migration up
```

### Option 2: Via Supabase Web Dashboard (SQL Editor)
1. Navigate to the **SQL Editor** in your Supabase project dashboard.
2. Open [`20260926000001_initial_schema.sql`](./20260926000001_initial_schema.sql) (or `supabase/schema.sql`), paste the contents, and click **Run**.
3. (Optional) Open [`20261002000001_seed_prototype_data.sql`](./20261002000001_seed_prototype_data.sql) (or `supabase/seed.sql`), paste the contents, and click **Run** to seed initial data.
