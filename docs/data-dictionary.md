# VittMitra Data Dictionary & Entity Reference

This document defines the database architecture, active infrastructure tables, planned future domain entities, and data integrity standards for the VittMitra platform.

---

## 1. Active Infrastructure Tables (Step 2 — Foundation)

### `_dev_infrastructure_heartbeat` `[ACTIVE / INFRASTRUCTURE TESTING ONLY]`
Minimal development testing table created strictly to verify:
- Async SQLAlchemy ORM table creation and primary key indexing.
- PostGIS spatial geometry mapping (`Geometry(Point, 4326)`) and GIST spatial indexing.
- Alembic database migration execution.
*Note: This is an infrastructure verification table and NOT a business domain entity.*

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto Increment | Unique record ID |
| `component_name` | `VARCHAR(100)` | NOT NULL | Service / module name being tested |
| `status_note` | `VARCHAR(255)` | NOT NULL, Default: `'healthy'` | Diagnostic message |
| `test_location` | `GEOMETRY(Point, 4326)` | Spatial Index (GIST) | Test spatial coordinate point for PostGIS validation |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Last update timestamp |

---

## 2. Planned / Future Conceptual Entities (Step 3+ Implementation)

> [!IMPORTANT]
> The following entities are **PLANNED CONCEPTUAL DESIGNS** for future milestones.
> They are intentionally **NOT** created in the database during Step 2.

### User & Entrepreneur Profile Domain
- **`users`** `[PLANNED]`: Authentication accounts, mobile phone numbers, email, preferred language, role (`entrepreneur`, `channel_partner`, `admin`).
- **`entrepreneur_profiles`** `[PLANNED]`: Socio-economic demographics (Age, Gender, Social Category: `SC`/`ST`/`OBC`/`General`/`Minority`/`SpeciallyAbled`, Family Income, EDP training, Education).

### Business & Geospatial Domain
- **`businesses`** `[PLANNED]`: Enterprise concept, sector (`manufacturing`, `services`, `trading`, `agro_allied`, `handicrafts`), enterprise stage (`idea`, `new_enterprise`, `expansion`), ownership structure (`sole_proprietorship`, `partnership`, `shg`, `cooperative`).
- **`locations`** `[PLANNED]`: PostGIS-backed location profiles (State, District, Sub-district block, Pincode, Area Type: `rural`/`urban`/`aspirational_district`/`ner_hilly`, spatial Point coordinates).
- **`business_signals`** `[PLANNED]`: Location-specific demand signals, local supply chain clusters, and commercial viability indicators.

### Scheme Master & Eligibility Domain
- **`schemes`** `[PLANNED]`: Normalized master repository of central and state government schemes (PMEGP, Stand-Up India, Mudra, PM-SVANidhi, etc.) with subsidy caps, interest subventions, and target beneficiaries.
- **`scheme_eligibility_rules`** `[PLANNED]`: Deterministic criteria rules (Age bounds, allowed categories, allowed sectors, minimum education, investment thresholds).
- **`scheme_documents`** `[PLANNED]`: Required documentation checklists and verification rules linked to scheme guidelines.
- **`scheme_sources`** `[PLANNED]`: Official government gazettes, ministry notification URLs, circular dates, and verification audit metadata.

### Financial Structuring Domain
- **`financial_profiles`** `[PLANNED]`: Project cost breakdown (Capital expenditure, working capital, total project cost, margin money contribution, expected subsidy, net bank loan).
- **`financial_scenarios`** `[PLANNED]`: Cash-flow projections, debt-service coverage ratio (DSCR), estimated monthly EMIs, and affordability simulations.

### Matching, Recommendation & Channel Partner Domain
- **`recommendations`** `[PLANNED]`: Best-fit scheme rankings and suitability scores.
- **`eligibility_results`** `[PLANNED]`: Deterministic pass/fail rule evaluation records with specific qualifying and disqualifying criteria breakdowns.
- **`channel_partners`** `[PLANNED]`: Verified Common Service Centres (CSC), District Industries Centres (DIC), bank branches, and certified mentors with PostGIS spatial coordinates.

### Application Filing & Post-Loan Advisory Domain
- **`applications`** `[PLANNED]`: End-to-end application instances, unique reference numbers, submission status (`draft`, `documents_pending`, `submitted`, `under_scrutiny`, `bank_sanctioned`, `disbursed`, `rejected`).
- **`application_status_history`** `[PLANNED]`: Immutable audit log of status transitions, timestamps, and stage remarks.
- **`application_tasks`** `[PLANNED]`: Actionable user checklists (document uploads, physical verifications, interview appointments).
- **`conversations` / `copilot_context`** `[PLANNED]`: Session contexts and interaction histories for the post-loan AI business copilot and multilingual advisor.

---

## 3. Data Integrity & Anti-Hallucination Principles

1. **Relational Constraints**: Use foreign key cascades, unique constraints, and check constraints (`CHECK (min_age <= max_age)`) to guarantee structural integrity.
2. **Deterministic Computations**: All scheme eligibility matches and financial DPR calculations are executed deterministically via structured code/SQL.
3. **Anti-Hallucination Policy**: Scheme parameters (subsidy rates, loan ceilings, eligibility limits) must trace directly to official verified government records stored in `scheme_sources`.
4. **Timezone Standardization**: All date and time fields must store UTC timestamps using `TIMESTAMPTZ`.
5. **Spatial Reference Standard**: All spatial geometries use SRID 4326 (WGS 84 coordinate reference system).
