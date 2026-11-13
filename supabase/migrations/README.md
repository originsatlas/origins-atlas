# Origins Atlas — Database Migrations

This directory contains the sequential, version-controlled database migrations for Origins Atlas, designed for Supabase and PostgreSQL 15+.

## Migration Index

| Order | Migration File | Description |
|---|---|---|
| `01` | [`20260926000001_initial_schema.sql`](./20260926000001_initial_schema.sql) | Baseline DDL: Extensions (`uuid-ossp`), 7 core relational tables, indexes, cascading foreign keys, basic RLS policies, and `updated_at` automated triggers. |
| `02` | [`20261002000001_seed_prototype_data.sql`](./20261002000001_seed_prototype_data.sql) | Prototype seed data: Realistic Bangkok luxury community (*Nirvana Absolute Bangna*), 4 verified real estate agencies, 6 canonical house units, 8 external source listings, price history records, verifications, and duplicate review queue. Protected by non-production safety guard. |
| `03` | [`20261109000001_security_and_foundation.sql`](./20261109000001_security_and_foundation.sql) | **Stage 1 Security & Foundation Hardening**: Revokes public write access from `anon`, introduces standardized category & province constraints, implements append-only immutable price history triggers with THB primary, adds soft-delete (`is_archived`) architecture, and creates `audit_logs` change-tracking table. |
| `04` | [`20261113000001_harden_stage1_closeout.sql`](./20261113000001_harden_stage1_closeout.sql) | **Stage 1 Architecture Review Close-Out**: Revokes all `INSERT`, `UPDATE`, `DELETE` access from the normal `authenticated` role (restricting direct writes exclusively to `service_role`), and hardens RLS write policies to target `service_role` exclusively. |

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
2. For fresh setup: Run `20260926000001_initial_schema.sql` followed by `20261109000001_security_and_foundation.sql`.
3. To update an existing database: Run `20261109000001_security_and_foundation.sql`.
4. (Optional development data): Run `20261002000001_seed_prototype_data.sql` in development or staging environments.
