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

### 📍 Milestone 5: Deterministic Financial Engine `[COMPLETED]`
- [x] Precision-safe mathematical calculations using Python `Decimal` with `ROUND_HALF_UP`.
- [x] Project cost breakdown & financing gap calculator (`project_cost = machinery + working_capital + other_costs`, `financing_gap = project_cost - own_contribution`).
- [x] Standard monthly reducing-balance EMI calculation with zero-interest support (`EMI = P * r * (1+r)^n / ((1+r)^n - 1)`).
- [x] Full repayment amortization summary (total interest, total repayment, financing percentage, own contribution percentage).
- [x] Debt-to-Income / affordability stress indicator computation (`DTI = (monthly_repayment / monthly_income) * 100`, categories: `LOW_RISK`, `MODERATE_RISK`, `HIGH_RISK`, `UNSPECIFIED`).
- [x] Comparative financial scenario evaluator (base, conservative, optimistic, custom) with interest rate and tenure variations.
- [x] Strict input validation and boundary condition enforcement (negative numbers, zero income, tenure limits, cost consistency).
- [x] Public API endpoints: `POST /api/v1/finance/calculate` and `POST /api/v1/finance/scenarios` (with root shortcuts).
- [x] 100% test coverage for calculations, scenarios, engine, and API integration (111 passed tests total).

---

### 📍 Milestone 6: Explainable Scheme Matching & Ranking Engine `[COMPLETED]`
- [x] Deterministic 6-dimension compatibility evaluation (Eligibility 35%, Financial Fit 20%, Sector Fit 15%, Business Stage Fit 10%, Target Beneficiary Fit 10%, Geographic Applicability 10%).
- [x] Transparent centralized scoring configuration in `app/services/matching/config.py` summing to 100.0 points.
- [x] Authoritative Step 4 Eligibility Engine reuse (mandatory rule failure dominates and prevents false eligibility recommendations).
- [x] Authoritative Step 5 Financial Engine reuse (validates project cost ceilings, loan thresholds, and affordability).
- [x] 3-tier recommendation categorization (`ELIGIBLE`, `POTENTIALLY_RELEVANT`, `NOT_ELIGIBLE`).
- [x] Structured, deterministic explainability reason generator ("Why this scheme?", "Why not currently eligible?", "Unverified criteria").
- [x] 5-tier deterministic tie-breaking & ranking engine ensuring stable, reproducible ordering.
- [x] Public API endpoint: `POST /api/v1/matching/schemes` (and root shortcut `POST /matching/schemes`).
- [x] Comprehensive test suite covering 15 core scenarios, unit tests, and API integration tests (138 passed tests total).
- [x] Regulatory non-guarantee disclaimer attached to all responses.
- [x] Strict zero-AI verification (100% deterministic code without LLM / embedding / ML dependencies).

---

### 📍 Milestone 7: Entrepreneur Onboarding & Profile Foundation `[COMPLETED]`
- [x] Relational database schema for `entrepreneurs`, `business_profiles`, and `financial_profiles` with Alembic migration `004_entrepreneur_profile_tables`.
- [x] Pydantic schemas and DTOs with strict input validation for phone, pincode, and financial bounds.
- [x] Deterministic profile completeness engine (section-by-section breakdown, missing fields list, completion percentage).
- [x] Full RESTful CRUD endpoints under `/api/v1/profiles` and sub-resources for business and financial inputs.
- [x] Integration adapters connecting stored profile entities to Step 4 Eligibility Engine, Step 5 Financial Engine, and Step 6 Scheme Matching Engine.
- [x] Minimal 5-step frontend onboarding wizard shell in Next.js (`frontend/app/onboarding/page.tsx`).
- [x] Zero sensitive PII policy (No Aadhaar, PAN, passwords, or bank account credentials stored).
- [x] Zero AI/LLM model involvement in profile creation, categorization, or scoring.
- [x] 160 passed automated tests across entire repository test suite.

---

### 📍 Milestone 8: Personalized Scheme Results, Details & Comparison `[COMPLETED]`
- [x] Primary "Schemes For You" personalized discovery page (`frontend/app/schemes/page.tsx`).
- [x] Detailed Scheme Profile & Grounding page (`frontend/app/schemes/[scheme_id]/page.tsx`).
- [x] Side-by-Side Scheme Comparison Matrix (`frontend/app/schemes/compare/page.tsx`).
- [x] Reusable explainability UI components:
  - `MatchBadge.tsx`: `ELIGIBLE`, `POTENTIALLY_RELEVANT`, `NOT_ELIGIBLE` with context score tooltip.
  - `WhyThisScheme.tsx`: Structured positive match reasons, negative disqualifiers, and unverified warnings.
  - `EligibilityBreakdown.tsx`: Criterion-by-criterion rule evaluation table with source citations.
  - `DocumentList.tsx`: Verified checklist of required documents (mandatory vs optional).
  - `SourceCard.tsx`: Official policy sources, publishers, gazette notices, and external links.
  - `ComparisonDrawer.tsx`: Sticky comparison dock enforcing 2-4 selected schemes limit.
  - `SchemeCard.tsx`: Master responsive discovery card with explainability bullets and quick actions.
  - `SchemeComparisonTable.tsx`: Side-by-side comparative table evaluating financial structures, eligibility, and benefits.
- [x] Frontend API bindings in `frontend/services/api.ts` connecting Next.js client with backend endpoints.
- [x] TypeScript compiler passes with 0 errors (`npx tsc --noEmit`).
- [x] Full test suite passes with 162/162 automated tests (100% pass rate).
- [x] Strict non-guarantee regulatory disclaimer attached to all discovery views.
- [x] Zero AI/LLM participation in matching, scoring, ranking, or eligibility evaluation.

---

### 📍 Milestone 9: Business & Location Intelligence + Business Feasibility `[COMPLETED]`
- [x] Relational and spatial database models for `district_msme_ecosystems` and `msme_clusters` using GeoAlchemy2 `Geometry(POINT, 4326)`.
- [x] Alembic migration `005_location_intelligence_tables` establishing spatial intelligence schema.
- [x] Controlled, verified MSME cluster & district profile seed dataset (`data/intelligence/clusters_seed.json`) with Ministry of MSME / MSE-CDP provenance.
- [x] Deterministic Signal Generator evaluating 6 signal dimensions (`LOCATION_SIGNAL`, `SECTOR_SIGNAL`, `BUSINESS_STAGE_SIGNAL`, `FINANCIAL_FEASIBILITY_SIGNAL`, `DATA_COMPLETENESS_SIGNAL`, `RISK_SIGNAL`).
- [x] Feasibility Engine synthesizing signals into structured outcomes (`FAVOURABLE`, `CAUTION`, `HIGH_RISK`, `INSUFFICIENT_DATA`), positive drivers, risk flags, missing fields, and actionable recommendations.
- [x] PostGIS spatial proximity queries calculating distance in kilometers to registered MSME industrial clusters and District Industries Centres (DICs).
- [x] RESTful API endpoints: `POST /api/v1/feasibility/analyze`, `GET /api/v1/profiles/{id}/feasibility`, `GET /api/v1/locations/intelligence`, `GET /api/v1/locations/nearby-clusters`.
- [x] Frontend Business & Location Feasibility view (`frontend/app/feasibility/page.tsx`) with profile switcher and full signal discovery.
- [x] Complete suite of UI components: `FeasibilitySummaryCard`, `SignalCard`, `SignalsList`, `RiskCautionSection`, `LocationIntelligenceCard`, `MissingInfoPrompt`.
- [x] Data provenance tagging (`VERIFIED`, `ESTIMATED`, `UNVERIFIED`, `INSUFFICIENT_DATA`) and mandatory non-guarantee regulatory disclaimer.
- [x] 100% deterministic code with ZERO AI / LLM / hallucinated demand scores.
- [x] 178 passed automated tests across entire repository test suite (100% pass rate).

---

### 📍 Milestone 10: Channel Partner + Application Assistance + Application Tracking `[COMPLETED]`
- [x] Relational and spatial database models for `channel_partners`, `scheme_channel_partners`, `applications`, and `application_status_history` using GeoAlchemy2 `Geometry(POINT, 4326)`.
- [x] Alembic migration `006_channel_partners_and_applications` establishing channel partner and application tracking schema.
- [x] Authoritative controlled seed dataset (`data/partners/partners_seed.json`) with PostGIS coordinate loader (`scripts/seed_partners.py`) for implementing agencies and lending banks (KVIC, DIC Pune, SBI SME Pune, SIDBI, PMC Urban Livelihood Cell, MSME-DFO Mumbai, DIC Varanasi).
- [x] `PartnerService` implementing PostGIS spatial radius queries (`ST_DWithin` / `ST_Distance`) with haversine fallback, scheme-partner prioritization by district, and partner details.
- [x] `ApplicationService` synthesizing personalized application assistance packages (eligibility summary, financial checklist, document requirements, verified channel partners) and managing full application lifecycle (`DRAFT`, `DOCUMENT_PREPARATION`, `PARTNER_ASSIGNED`, `APPLICATION_SUBMITTED`, `UNDER_REVIEW`, `SANCTIONED`, `DISBURSED`, `REJECTED`, `WITHDRAWN`).
- [x] Application status timeline tracking with immutable audit trail and explicit source attribution (`USER_RECORDED`, `PARTNER_UPDATED`, `OFFICIAL_PORTAL`).
- [x] Strict Anti-Fake Tracking Policy: Explicit disclaimer that tracking reflects self-recorded milestones and not live automated government portal sync.
- [x] RESTful API endpoints: `GET /api/v1/partners`, `GET /api/v1/partners/nearby`, `GET /api/v1/partners/{id}`, `GET /api/v1/schemes/{id}/partners`, `GET /api/v1/applications/assistance`, `POST /api/v1/applications`, `GET /api/v1/applications`, `GET /api/v1/applications/{id}`, `POST /api/v1/applications/{id}/status`.
- [x] Interactive Next.js Frontend views:
  - "How to Access & Channel Partners" (`frontend/app/schemes/[scheme_id]/access/page.tsx`)
  - "Application Tracker & Status Timeline" (`frontend/app/applications/page.tsx`)
- [x] Complete suite of UI components: `WhyThisPartner`, `PartnerCard`, `PartnerList`, `DocumentChecklistInteractive`, `ApplicationTimeline`, `StatusUpdateModal`, `ApplicationCard`, `ApplicationAssistanceView`.
- [x] 100% deterministic code with ZERO AI / LLM involvement in Step 10.
- [x] 185 passed automated tests across entire repository test suite (100% pass rate).

---

### 📍 Milestone 11: Grounded AI & Gemini RAG Intelligence Layer `[COMPLETED]`
- [x] Google Gemini 2.5 Flash integration with official `google-genai` SDK and structured JSON output enforcement.
- [x] Non-Negotiable Grounding Principle: Gemini is an explanation and conversational layer only; deterministic engines (Steps 3, 4, 5, 6, 9, 10) remain the sole authority.
- [x] PostgreSQL RAG knowledge base table (`knowledge_chunks`) with SHA-256 content hashes, semantic section types, source IDs, token counts, and normalized JSON vector embeddings (Alembic migration `007_knowledge_chunks_table`).
- [x] `SchemeKnowledgeChunker` generating 5 semantic chunks per scheme (`overview`, `eligibility_criteria`, `financial_benefits`, `required_documents`, `application_steps`).
- [x] `EmbeddingService` supporting Gemini `text-embedding-004` and deterministic 128-dimensional subword local vector fallback for zero-network testing resilience.
- [x] `HybridRAGRetriever` executing SQL metadata filtering + dense cosine vector similarity + lexical keyword/scheme boosts.
- [x] `AIOrchestrator` coordinating profile context lookup, Step 4 eligibility, Step 5 finance, Step 9 feasibility, RAG chunk retrieval, and verified source citations.
- [x] Grounded prompt templates with strict anti-hallucination, anti-injection, and insufficient data protocols (`SYSTEM_GROUNDING_PROMPT`).
- [x] RESTful API endpoints under `/api/v1/ai/`:
  - `GET /api/v1/ai/health`: Model status and deterministic verification confirmation.
  - `POST /api/v1/ai/chat`: Multi-turn grounded conversational assistance.
  - `POST /api/v1/ai/explain/eligibility`: Plain-language explanation of Step 4 rule criteria.
  - `POST /api/v1/ai/explain/finance`: Plain-language explanation of Step 5 loan and subsidy calculations.
  - `POST /api/v1/ai/explain/feasibility`: Plain-language explanation of Step 9 location MSME density signals.
  - `POST /api/v1/ai/explain/scheme`: Plain-language overview of scheme guidelines, benefits, and documents.
- [x] Frontend UI Components:
  - `ConfidenceBadge.tsx`: Visual confidence indicator (`HIGH`, `MEDIUM`, `LOW`, `INSUFFICIENT_DATA`).
  - `SourceCitationCard.tsx`: Traceable official source badges with verification dates and external links.
  - `AIExplanationCard.tsx`: Collapsible AI explainer embedded in Scheme Details, Feasibility, and Access pages.
  - `GroundedChatDrawer.tsx`: Slide-out conversational copilot with quick prompt suggestions, dynamic context badges, and citation sources.
  - `GlobalAITrigger.tsx`: Floating global AI assistant trigger with keyboard shortcut (`⌘K` / `Ctrl+K`) mounted in `layout.tsx`.
- [x] 100% test coverage: 202 passed backend tests across entire repository (100% pass rate) and zero Next.js TypeScript build errors.

---

### 📍 Milestone 12: Integrated Dashboard + End-to-End User Experience `[COMPLETED]`
- [x] Comprehensive unified entrepreneur dashboard aggregation service (`DashboardService`) synthesizing profile completeness, Step 5 financial structure, Step 6 scheme recommendations, Step 9 location feasibility, and Step 10 application records.
- [x] Deterministic 8-stage user workflow progress tracking (`ProgressJourney`) and state-aware priority action recommender (`NextBestAction`).
- [x] RESTful API endpoints: `GET /api/v1/dashboard` (default/session dashboard) and `GET /api/v1/profiles/{id}/dashboard` (profile-specific dashboard).
- [x] Interactive Next.js Dashboard page (`frontend/app/dashboard/page.tsx`):
  - Personalized welcome banner & profile completeness tracker.
  - System trust & provenance banner (Verified Govt Rules, Mathematical Amortization, PostGIS Spatial Feasibility, User-Recorded Applications, Grounded Gemini AI).
  - Visual 8-Stage Progress Journey Map with 1-click stage navigation.
  - Deterministic Next Best Actions cards with priority ranking and direct CTAs.
  - Executive snapshot 4-card metric grid (Top Match Scheme, Location Feasibility, Financial Structure, Application Tracking).
  - Recommended Schemes grid with match scores, explainability reasons, max loan/subsidy display, and dual CTAs.
  - 1-Click Grounded Gemini Copilot quick prompt launcher & slide-out chat drawer.
- [x] Global UI Navigation & Profile Synchronization:
  - Top navigation bar (`Navbar.tsx`) with active profile indicator, instant profile switcher dropdown across all seeded profiles, and mobile drawer.
  - Global `ProfileProvider` context and `useProfile` hook managing active `profileId` state with `localStorage` persistence.
  - Polished landing page (`frontend/app/page.tsx`) connecting dashboard, scheme matching, feasibility, and onboarding.
  - Seamless redirection from onboarding completion to personalized dashboard.
- [x] Explicit trust indicators, non-guarantee regulatory disclaimers, and user-recorded application tags.
- [x] Full test suite passes: 206 passed automated backend tests (100% pass rate), zero TypeScript type errors, and clean Next.js production build.

---

### 📍 Milestone 13: Comprehensive Testing + Security + Data Quality + System Hardening `[COMPLETED]`
- [x] Full layered test strategy across all 9 levels (Unit, Service, API, Database, Frontend, E2E Journey, Security Audit, Regression, Failure Recovery).
- [x] Total 233 automated backend tests passing with 100% success rate (zero skipped, zero regressions).
- [x] Security audit & vulnerability hardening:
  - SQL injection resilience verified with parameter sanitization and test coverage across all query endpoints.
  - Gemini prompt injection & jailbreak defense verified against system override, prompt extraction, and rogue approval exploits.
  - Adversarial hallucination defense verified: Non-existent schemes and out-of-scope queries return `INSUFFICIENT_DATA` with official portal guidance.
  - Input validation hardened: Boundary length enforcement, negative project cost rejection, and null byte handling.
  - Secret scanning & environment hygiene verified: Zero credential leaks, clean `.env.example` template, and protected API keys.
- [x] Database & data quality hardening:
  - Foreign key constraints & clean cascade deletions verified on relational profile models.
  - PostGIS coordinate boundaries validated ($lat \in [-90, 90]$, $lon \in [-180, 180]$) and spatial indexing verified.
  - All 7 Alembic migration scripts validated for DAG revision consistency.
  - Complete data provenance and statutory rule authority verified across all 5 central schemes and channel partners.
- [x] Failure recovery & resilience:
  - Graceful offline fallback to deterministic synthesizer when Gemini LLM API is unavailable.
  - Missing profile UUID and unknown scheme fallback handling without 500 crashes.
  - Boundary mathematical and zero-division resilience verified across financial calculator and feasibility engines.
- [x] Frontend quality: Next.js TypeScript validation passes with 0 errors and production build succeeds for all 10 routes.

---

### ⏳ Milestone 14: Deployment Readiness & Production Operations
- [ ] Production containerization & orchestration.
- [ ] CI/CD pipeline automation with automated test gates.
- [ ] Production database provisioning & backup policy.
- [ ] Multilingual voice integration (Bhashini API).


