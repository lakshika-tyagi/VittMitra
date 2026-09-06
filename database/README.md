# Database Architecture & Migrations

This directory contains the database migration scripts, DDL schema definitions, and seed data for VittMitra.

## Structure
- `migrations/`: Alembic migration scripts for database versioning and schema evolutions.
- `schema/`: Raw SQL DDL and PostGIS spatial extension setup scripts.
- `seeds/`: Initial reference data (states, districts, scheme categories, sectors).

## Database Engine
- **Primary Engine**: PostgreSQL 15+
- **Spatial Extension**: PostGIS 3.3+ (for spatial queries, district buffering, and demographic overlay analysis)

## Connection
Database connection is configured via `DATABASE_URL` in the root `.env`.

*Note: Schema creation and database tables will be fully implemented in Step 2.*
