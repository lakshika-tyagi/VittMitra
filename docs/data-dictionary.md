# VittMitra Data Dictionary & Entity Reference

This document defines the database architecture, active scheme knowledge tables, planned future domain entities, and data integrity standards for the VittMitra platform.

---

## 1. Active Infrastructure & Scheme Knowledge Tables (Step 2 & Step 3)

### A. `schemes` `[ACTIVE / STEP 3]`
Master repository of authoritative central and state government schemes.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-Increment | Unique internal record ID |
| `scheme_code` | `VARCHAR(50)` | UNIQUE, INDEXED, NOT NULL | Standard code (e.g. `'PMEGP'`, `'STANDUP_INDIA'`, `'MUDRA_PMMY'`) |
| `scheme_name` | `VARCHAR(255)` | NOT NULL | Official full title of the government scheme |
| `short_description` | `TEXT` | NOT NULL | Plain-language executive summary of the scheme |
| `nodal_ministry` | `VARCHAR(255)` | NOT NULL | Governing Government of India Ministry (e.g. Ministry of MSME) |
| `nodal_department` | `VARCHAR(255)` | NULLABLE | Specific executing department / board (e.g. KVIC, SIDBI) |
| `geography_level` | `VARCHAR(50)` | NOT NULL, Default: `'NATIONAL'` | Geographic scope (`NATIONAL`, `STATE`, `REGIONAL`) |
| `target_beneficiaries`| `JSON` | NOT NULL | Eligible demographic groups (`["SC", "ST", "Women", "OBC", "General"]`) |
| `purpose` | `TEXT` | NOT NULL | Core economic objective of the scheme |
| `benefits_summary` | `JSON` | NOT NULL | Structured financial benefits, loan ceilings, subsidy rates |
| `business_stages` | `JSON` | NOT NULL | Applicable enterprise phases (`["idea", "new_enterprise", "expansion"]`) |
| `sectors` | `JSON` | NOT NULL | Eligible industry sectors (`["manufacturing", "services", "trading"]`) |
| `data_status` | `VARCHAR(20)` | NOT NULL, Default: `'VERIFIED'` | Data confidence level (`VERIFIED`, `ESTIMATED`, `UNVERIFIED`) |
| `is_active` | `BOOLEAN` | NOT NULL, Default: `true` | Operational availability flag |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Record last updated timestamp |

---

### B. `scheme_sources` `[ACTIVE / STEP 3]`
Authoritative source traceability linking every government fact to official records.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-Increment | Unique source ID |
| `scheme_id` | `INTEGER` | Foreign Key (`schemes.id` ON DELETE CASCADE), INDEXED | Parent scheme reference |
| `source_name` | `VARCHAR(255)` | NOT NULL | Authoritative publisher name (e.g. Ministry Guidelines) |
| `source_type` | `VARCHAR(50)` | NOT NULL | Type: `OFFICIAL_WEBSITE`, `OFFICIAL_GUIDELINE`, `OFFICIAL_PORTAL` |
| `official_url` | `VARCHAR(1000)`| NOT NULL | Official accessible government web address |
| `document_reference`| `VARCHAR(255)` | NULLABLE | Gazette notification number or circular citation |
| `publication_date` | `VARCHAR(50)` | NULLABLE | Date of official publication |
| `last_verified_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Timestamp when facts were last audited |
| `version` | `VARCHAR(50)` | NOT NULL, Default: `'1.0'` | Document version or revision year |
| `notes` | `TEXT` | NULLABLE | Verification context or amendment notes |
| `is_active` | `BOOLEAN` | NOT NULL, Default: `true` | Source validity status |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Record last updated timestamp |

---

### C. `scheme_eligibility_rules` `[ACTIVE / STEP 3]`
Structured deterministic eligibility criteria for automated rule evaluation.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-Increment | Unique rule ID |
| `scheme_id` | `INTEGER` | Foreign Key (`schemes.id` ON DELETE CASCADE), INDEXED | Parent scheme reference |
| `rule_code` | `VARCHAR(100)` | NOT NULL | Machine-readable rule code (e.g. `'PMEGP_MIN_AGE'`) |
| `field_name` | `VARCHAR(100)` | NOT NULL | Target profile attribute (`age`, `social_category`, `is_greenfield`) |
| `operator` | `VARCHAR(20)` | NOT NULL | Comparison operator (`>=`, `<=`, `==`, `in`, `not_in`, `contains`) |
| `expected_value` | `JSON` | NOT NULL | Expected threshold, allowed array, or Boolean flag |
| `description` | `TEXT` | NOT NULL | Plain English explainable explanation of rule |
| `source_id` | `INTEGER` | Foreign Key (`scheme_sources.id` ON DELETE SET NULL) | Traceable source guideline reference |
| `rule_version` | `VARCHAR(50)` | NOT NULL, Default: `'1.0'` | Rule criteria version |
| `is_active` | `BOOLEAN` | NOT NULL, Default: `true` | Rule evaluation flag |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Record last updated timestamp |

---

### D. `scheme_documents` `[ACTIVE / STEP 3]`
Required document checklists tied to official scheme guidelines.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-Increment | Unique document ID |
| `scheme_id` | `INTEGER` | Foreign Key (`schemes.id` ON DELETE CASCADE), INDEXED | Parent scheme reference |
| `document_code` | `VARCHAR(100)` | NOT NULL | Standard document code (e.g. `'AADHAAR_CARD'`, `'PROJECT_REPORT'`) |
| `document_name` | `VARCHAR(255)` | NOT NULL | Human-readable document title |
| `description` | `TEXT` | NULLABLE | Guidance instructions for applicant |
| `is_mandatory` | `BOOLEAN` | NOT NULL, Default: `true` | Mandatory vs. conditional flag |
| `source_id` | `INTEGER` | Foreign Key (`scheme_sources.id` ON DELETE SET NULL) | Source reference |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Record last updated timestamp |

---

### E. `_dev_infrastructure_heartbeat` `[ACTIVE / INFRASTRUCTURE TESTING]`
Development verification table validating PostgreSQL ORM and PostGIS spatial point geometries.

---

## 2. Planned / Future Conceptual Entities (Step 4+ Implementation)

> [!IMPORTANT]
> The following entities are **PLANNED CONCEPTUAL DESIGNS** for subsequent milestones.
> They are intentionally **NOT** created in the database during Step 3.

- **`users`** `[PLANNED]`: User accounts and roles.
- **`entrepreneur_profiles`** `[PLANNED]`: Demographics (Age, Category, Gender, Education, Income).
- **`businesses`** `[PLANNED]`: Enterprise concept, sector, stage, and ownership.
- **`locations`** `[PLANNED]`: PostGIS spatial profiles (State, District, Urban/Rural, Coordinates).
- **`business_signals`** `[PLANNED]`: Regional demand clusters and supply chain viability indicators.
- **`financial_profiles`** `[PLANNED]`: Fixed capital, working capital, subsidy, and loan structure.
- **`financial_scenarios`** `[PLANNED]`: Cash-flow projections, DSCR, and monthly EMI amortization.
- **`recommendations`** `[PLANNED]`: Best-fit scheme rankings.
- **`eligibility_results`** `[PLANNED]`: Deterministic rule evaluation pass/fail logs.
- **`channel_partners`** `[PLANNED]`: CSC centers and DIC offices with spatial coordinates.
- **`applications`** `[PLANNED]`: Application drafts, submissions, and status history.
- **`conversations` / `copilot_context`** `[PLANNED]`: Post-loan AI advisor chat sessions.

---

## 3. Data Integrity & Anti-Hallucination Principles

1. **Strict Authoritative Grounding**: All scheme parameters must reference official ministry URLs and gazette citations.
2. **Deterministic Computations**: Eligibility and financial math are evaluated in code/SQL, never in LLMs.
3. **Auditability**: Every scheme change preserves version metadata and `last_verified_at` timestamps.
