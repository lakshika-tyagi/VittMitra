# VittMitra Phased Development Roadmap

The platform is developed methodically through structured, verified milestones.

---

## Milestone Breakdown

### 📍 Milestone 1: Repository & Development Environment Initialization `[COMPLETED]`
- [x] Git repository initialization and `.gitignore` setup.
- [x] Standard multi-service project directory structure (`frontend/`, `backend/`, `ai-services/`, `data/`, `database/`, `docs/`, `scripts/`, `tests/`).
- [x] Next.js + TypeScript frontend foundation.
- [x] FastAPI + Python backend foundation with `/health` endpoint.
- [x] AI-services foundation directory & structure.
- [x] Docker compose configuration for Postgres/PostGIS and services.
- [x] Comprehensive documentation and environment templates.
- [x] Validation of builds and health endpoints.

---

### 📍 Milestone 2: Database Foundation (PostgreSQL + PostGIS + SQLAlchemy + Alembic) `[COMPLETED]`
- [x] Async database engine and session management in `backend/app/db/` using SQLAlchemy 2.0.
- [x] PostGIS spatial extension enabled and configured via Alembic.
- [x] Minimal development infrastructure testing model (`InfrastructureHeartbeat`).
- [x] Alembic migration system configured with offline & online async execution (`backend/alembic/`).
- [x] Database health check (`/health/db`) and PostGIS check (`/health/postgis`) implemented with secure 503 error handling.
- [x] Comprehensive architecture and data dictionary documentation updated.

---

### 📍 Milestone 3: Scheme Knowledge & Controlled Seed Data Foundation `[COMPLETED]`
- [x] Master scheme knowledge database models (`schemes`, `scheme_sources`, `scheme_eligibility_rules`, `scheme_documents`).
- [x] Alembic migration `002_scheme_knowledge` establishing relational scheme schema.
- [x] Authoritative seed data for 5 major central schemes (`PMEGP`, `MUDRA_PMMY`, `STANDUP_INDIA`, `PM_SVANIDHI`, `PM_VISHWAKARMA`).
- [x] Read-only scheme discovery API endpoints (`GET /api/v1/schemes`, `GET /api/v1/schemes/{id}`).
- [x] Strict data confidence tagging (`VERIFIED`, `ESTIMATED`, `UNVERIFIED`) and zero-hallucination source linking.

---

### 📍 Milestone 4: Deterministic Eligibility Engine `[COMPLETED]`
- [x] Rule evaluation engine evaluating criteria (`>=`, `>`, `<=`, `<`, `==`, `!=`, `IN`, `NOT_IN`, `CONTAINS`, `NOT_CONTAINS`, `BOOLEAN`).
- [x] Three-state eligibility outcomes (`MATCHED`, `FAILED`, `UNVERIFIED`) with safe null & type-error handling.
- [x] Safe field resolver and alias mapper supporting numeric, categorical, boolean, and compound fields.
- [x] Deterministic, natural-language explanation synthesizer (Zero AI / LLM involvement).
- [x] Complete source and guideline traceability attached to every criterion result.
- [x] Scheme-level aggregation logic distinguishing mandatory vs. optional rules.
- [x] Public API endpoint: `POST /api/v1/eligibility/check` and root shortcut `POST /eligibility/check`.
- [x] Comprehensive unit and API test suite (63+ passed automated tests).

---

### ⏳ Milestone 5: Deterministic Financial Engine
- [ ] Fixed capital and working capital structuring engine.
- [ ] Scheme-specific subsidy and margin money calculator (General vs. Special category rates, Rural vs. Urban).
- [ ] Bank loan requirement, interest rate, and monthly EMI amortization schedule computation.
- [ ] Detailed Project Report (DPR) financial feasibility synthesizer.

---

### ⏳ Milestone 6: Scheme Matching & Multi-Criteria Ranking Engine
- [ ] Scoring and ranking algorithm for best-fit schemes across eligible matches.
- [ ] Multi-scheme side-by-side comparison matrices.
- [ ] Beneficiary prioritization and subsidy maximization engine.

---

### ⏳ Milestone 7: Grounded AI & RAG Services (Gemini Integration)
- [ ] Retrieval Augmented Generation (RAG) over verified scheme guidelines.
- [ ] Natural-language explanation synthesizer for scheme eligibility.
- [ ] Multilingual conversational query assistant.
- [ ] Strict grounding filters to prevent hallucination.

---

### ⏳ Milestone 8: Premium Frontend Experience & UI Modules
- [ ] Fintech-grade Design System & Component Library.
- [ ] Profile creation & Onboarding wizard.
- [ ] Interactive Location & Business Feasibility visualizers.
- [ ] Financial structure calculator & slider controls.
- [ ] Scheme match results, comparison cards, and explanation views.

---

### ⏳ Milestone 9: Application Assistance, Channel Partners & Tracking
- [ ] Document checklist generator tailored to user's scheme & category.
- [ ] Channel partner / CSC locator & verification workflow.
- [ ] Application submission & status timeline tracking.

---

### ⏳ Milestone 10: Post-Loan AI Business Copilot & Platform Polish
- [ ] Post-loan advisory copilot (Working capital management, compliance alerts, growth tips).
- [ ] Multilingual voice integration (Bhashini).
- [ ] Full end-to-end integration testing, security audit, and performance optimization.
