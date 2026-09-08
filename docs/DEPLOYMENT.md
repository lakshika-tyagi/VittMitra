# VittMitra (वित्तमित्र) — Production Deployment & Operations Guide

This guide provides complete, step-by-step instructions for deploying, configuring, and operating the VittMitra platform in development, staging, and production environments.

---

## 1. System Architecture & Topology

VittMitra follows an API-first, decoupled architecture:

```text
                           Internet / User
                                 │
                                 ▼
                    [ Reverse Proxy / Nginx / TLS ]
                                 │
            ┌────────────────────┴────────────────────┐
            ▼                                         ▼
   [ Next.js Frontend ]                     [ FastAPI Backend ]
   (Port 3000 / SSR & CSR)                  (Port 8000 / REST API)
                                                      │
                                   ┌──────────────────┴──────────────────┐
                                   ▼                                     ▼
                      [ PostgreSQL 15 + PostGIS 3.3 ]           [ Google Gemini API ]
                      - Relational Schemas                      - Model: gemini-2.5-flash
                      - PostGIS Spatial Queries                 - Grounded Explanations
                      - Knowledge Chunks & Vectors              - JSON Strict Output
```

---

## 2. Prerequisites & System Requirements

### Hardware Requirements
- **Minimum**: 2 vCPU, 4 GB RAM, 20 GB SSD
- **Recommended (Production)**: 4 vCPU, 8 GB RAM, 50 GB SSD

### Software Dependencies
- **Docker Engine**: `20.10.x` or higher
- **Docker Compose**: `2.x` or higher
- **Node.js** (for local/bare-metal): `18.x` or `20.x` LTS
- **Python** (for local/bare-metal): `3.11` or `3.13`
- **PostgreSQL**: `15.x` with **PostGIS `3.3+`**

---

## 3. Environment Configuration (`.env`)

Duplicate `.env.example` to `.env` in the repository root:

```bash
cp .env.example .env
```

### Complete Environment Variable Reference

| Variable Name | Environment | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | All | `production` (or `development`) | Runtime mode (controls docs visibility & error verbosity) |
| `DEBUG` | All | `False` in prod, `True` in dev | Disables debug stack traces in production |
| `APP_NAME` | All | `VittMitra` | Application identity string |
| `SECRET_KEY` | Production | *64-char random hex string* | Cryptographic signing key |
| `DATABASE_URL` | Backend | `postgresql+asyncpg://user:pass@host:5432/vittmitra_db` | Async SQLAlchemy database connection string |
| `POSTGRES_USER` | Database | `vittmitra_user` | PostgreSQL database user |
| `POSTGRES_PASSWORD`| Database | *secure password* | PostgreSQL database password |
| `POSTGRES_DB` | Database | `vittmitra_db` | Master database name |
| `POSTGRES_PORT` | Database | `5432` | Exposed database port |
| `ALLOWED_ORIGINS` | Backend | `https://vittmitra.gov.in,https://app.vittmitra.in` | Whitelisted CORS frontend origins (comma-separated) |
| `GEMINI_API_KEY` | Backend | `AIzaSy...` | Google Gemini API key for Grounded AI & RAG |
| `GEMINI_MODEL` | Backend | `gemini-2.5-flash` | Gemini model variant |
| `RAG_TOP_K` | Backend | `5` | Maximum semantic chunks retrieved per query |
| `RAG_SIMILARITY_THRESHOLD` | Backend | `0.35` | Minimum cosine similarity score cutoff |
| `NEXT_PUBLIC_API_URL` | Frontend | `https://api.vittmitra.in/api/v1` | Public backend API URL consumed by client |
| `NEXT_PUBLIC_APP_NAME` | Frontend | `VittMitra` | Display name rendered in UI header |

> [!CAUTION]
> **Zero Client Secrets**: `GEMINI_API_KEY` and database passwords must NEVER be prefixed with `NEXT_PUBLIC_` or bundled into client code.

---

## 4. Docker Compose Deployment (Recommended)

### Step 1: Start All Services
```bash
docker-compose up -d --build
```

### Step 2: Run Bootstrap & Database Initialization
Execute the one-command bootstrap script inside the backend container to apply migrations and seed all data:
```bash
docker-compose exec backend python ../scripts/bootstrap_deployment.py
```

### Step 3: Verify Container Health
```bash
docker-compose ps
```
Expected output:
- `vittmitra_database` (healthy, port 5432)
- `vittmitra_backend` (healthy, port 8000)
- `vittmitra_frontend` (running, port 3000)

---

## 5. Standalone / Bare-Metal Deployment

### A. Database Setup
```bash
# Ubuntu/Debian example
sudo apt update
sudo apt install -y postgresql-15 postgresql-15-postgis-3

# Configure database & user
sudo -u postgres psql -c "CREATE USER vittmitra_user WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "CREATE DATABASE vittmitra_db OWNER vittmitra_user;"
sudo -u postgres psql -d vittmitra_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### B. Backend Deployment
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install --no-cache-dir -r requirements.txt

# Run migrations & seed data
alembic upgrade head
python ../scripts/bootstrap_deployment.py

# Start production server with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### C. Frontend Deployment
```bash
cd frontend
npm ci
npm run build
npm run start -- -p 3000
```

---

## 6. Migration & Database Operations

All schema versions are tracked with Alembic migrations under `backend/alembic/versions/`.

```bash
# Check current migration revision
cd backend
alembic current

# Upgrade to latest revision (head)
alembic upgrade head

# Rollback 1 migration step
alembic downgrade -1
```

---

## 7. Backup & Disaster Recovery Procedures

### Automated Database Backup
Run the backup script to create a timestamped SQL archive under `database/backups/`:
```bash
python scripts/backup_db.py
```

### Docker Compose Direct Backup
```bash
docker-compose exec -T database pg_dump -U vittmitra_user -d vittmitra_db > database/backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore
```bash
# Restore via utility script (requires --confirm flag)
python scripts/restore_db.py --confirm database/backups/vittmitra_backup_20260908_120000.sql

# Restore via Docker Compose
cat database/backups/vittmitra_backup_20260908_120000.sql | docker-compose exec -T database psql -U vittmitra_user -d vittmitra_db
```

---

## 8. Health Checks & System Monitoring

| Endpoint | Method | Expected Status | Purpose |
| :--- | :---: | :---: | :--- |
| `/health` | `GET` | `200 OK` | Backend application liveness probe |
| `/health/db` | `GET` | `200 OK` / `503 Service Unavailable` | PostgreSQL connection health & version |
| `/health/postgis` | `GET` | `200 OK` / `503 Service Unavailable` | PostGIS spatial extension verification |
| `/api/v1/ai/health` | `GET` | `200 OK` | Grounded AI & RAG retriever readiness |

### Health Check Verification Commands
```bash
curl -I http://localhost:8000/health
curl -I http://localhost:8000/health/db
curl -I http://localhost:8000/health/postgis
curl -I http://localhost:8000/api/v1/ai/health
```

---

## 9. Nginx Reverse Proxy & TLS / HTTPS Configuration

Recommended production Nginx server configuration (`/etc/nginx/sites-available/vittmitra`):

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name vittmitra.gov.in api.vittmitra.gov.in;
    return 301 https://$host$request_uri;
}

# Frontend Application (vittmitra.gov.in)
server {
    listen 443 ssl http2;
    server_name vittmitra.gov.in;

    ssl_certificate /etc/letsencrypt/live/vittmitra.gov.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vittmitra.gov.in/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API (api.vittmitra.gov.in)
server {
    listen 443 ssl http2;
    server_name api.vittmitra.gov.in;

    ssl_certificate /etc/letsencrypt/live/vittmitra.gov.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vittmitra.gov.in/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 10. Troubleshooting & FAQ

### 1. Database Connection Refused (`port 5432`)
- Ensure PostgreSQL container is running: `docker-compose ps database`
- In Docker, verify backend `DATABASE_URL` uses `@database:5432`, not `@localhost:5432`.

### 2. PostGIS Extension Missing
- Connect to database and run: `CREATE EXTENSION IF NOT EXISTS postgis;`

### 3. Gemini API Quota or Key Missing
- Check `.env` contains `GEMINI_API_KEY=AIzaSy...`.
- If key is empty, VittMitra automatically uses the offline deterministic Grounded Synthesizer with zero 500 errors.

### 4. CORS Errors in Browser
- Ensure `ALLOWED_ORIGINS` in `.env` contains your exact frontend origin (e.g. `http://localhost:3000`).
