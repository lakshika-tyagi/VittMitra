# Database Architecture & Migrations (PostgreSQL + PostGIS)

This directory contains the database migration scripts, DDL schema definitions, and seed data for VittMitra.

## Database Stack
- **Database Engine**: PostgreSQL 15+
- **Spatial Extension**: PostGIS 3.3+ (for spatial queries, district buffering, and demographic overlay analysis)
- **ORM**: SQLAlchemy 2.0 (Asyncio)
- **Driver**: `asyncpg` (FastAPI async queries) / `psycopg` (synchronous tooling)
- **Migration Framework**: Alembic 1.13+

## Directory Structure
- `migrations/`: Migration references and archive.
- `schema/`: Raw SQL DDL and PostGIS spatial extension setup scripts.
- `seeds/`: Seed reference payloads.

## Running Migrations (Alembic)

Migrations are located in `backend/alembic/`.

### 1. Run Migrations Online (Against Running PostgreSQL Database)
```bash
cd backend
alembic upgrade head
```

### 2. Generate Migration SQL Script (Offline Mode)
```bash
cd backend
alembic upgrade head --sql
```

### 3. Create a New Migration
```bash
cd backend
alembic revision -m "description_of_change"
```

## PostGIS Extension Verification

To verify that PostGIS is active in your database, execute:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_Full_Version();
```
Or query the backend health check endpoint:
```bash
curl http://localhost:8000/health/postgis
```
