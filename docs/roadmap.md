# VittMitra Phased Development Roadmap

The platform is developed methodically through structured, verified milestones.

---

## Milestone Breakdown

### 📍 Milestone 1: Repository & Development Environment Initialization `[CURRENT / COMPLETED]`
- [x] Git repository initialization and `.gitignore` setup.
- [x] Standard multi-service project directory structure (`frontend/`, `backend/`, `ai-services/`, `data/`, `database/`, `docs/`, `scripts/`, `tests/`).
- [x] Next.js + TypeScript frontend foundation.
- [x] FastAPI + Python backend foundation with `/health` endpoint.
- [x] AI-services foundation directory & structure.
- [x] Docker compose configuration for Postgres/PostGIS and services.
- [x] Comprehensive documentation and environment templates.
- [x] Validation of builds and health endpoints.

---

### ⏳ Milestone 2: Data Models, Schema Design & Controlled Seed Dataset Setup
- [ ] Database schema DDL for core entities (`users`, `entrepreneur_profiles`, `businesses`, `locations`, `schemes`, `eligibility_rules`, `financial_profiles`).
- [ ] PostGIS spatial schema for location tracking & district mapping.
- [ ] Controlled seed dataset for verified flagship schemes (PMEGP, Stand-Up India, Mudra, PM-SVANidhi, etc.).
- [ ] Schema validation and Alembic migration scripts.

---

### ⏳ Milestone 3: Core Backend APIs & Deterministic Business / Financial Engines
- [ ] User profiling & entrepreneur onboarding endpoints.
- [ ] Business feasibility calculation services.
- [ ] Deterministic financial engine (Project Cost, Subsidy, Own Contribution, Loan EMI, Cash-flow feasibility).
- [ ] Geospatial location query services with PostGIS.

---

### ⏳ Milestone 4: Deterministic Scheme Eligibility & Matching Engine
- [ ] Rule evaluation engine evaluating criteria (Age, Social Category, Gender, Location, Project Size, Sector).
- [ ] Scoring and ranking algorithm for best-fit schemes.
- [ ] Scheme comparison matrices.

---

### ⏳ Milestone 5: Grounded AI & RAG Services (Gemini Integration)
- [ ] Retrieval Augmented Generation (RAG) over verified scheme guidelines.
- [ ] Natural-language explanation synthesizer for scheme eligibility.
- [ ] Multilingual conversational query assistant.
- [ ] Strict grounding filters to prevent hallucination.

---

### ⏳ Milestone 6: Premium Frontend Experience & UI Modules
- [ ] Fintech-grade Design System & Component Library.
- [ ] Profile creation & Onboarding wizard.
- [ ] Interactive Location & Business Feasibility visualizers.
- [ ] Financial structure calculator & slider controls.
- [ ] Scheme match results, comparison cards, and explanation views.

---

### ⏳ Milestone 7: Application Assistance, Channel Partners & Tracking
- [ ] Document checklist generator tailored to user's scheme & category.
- [ ] Channel partner / CSC locator & verification workflow.
- [ ] Application submission & status timeline tracking.

---

### ⏳ Milestone 8: Post-Loan AI Business Copilot & Platform Polish
- [ ] Post-loan advisory copilot (Working capital management, compliance alerts, growth tips).
- [ ] Multilingual voice integration (Bhashini).
- [ ] Full end-to-end integration testing, security audit, and performance optimization.
