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

### C. `scheme_eligibility_rules` `[ACTIVE / STEP 3 & 4]`
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
| `is_mandatory` | `BOOLEAN` | NOT NULL, Default: `true` | Mandatory vs. optional/advisory rule flag |
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

## 2. Financial Engine Data Contracts & Precision Standards `[STEP 5]`

The Financial Engine is stateless and operates directly on strictly validated Pydantic models. All monetary calculations are performed with Python `Decimal` (`ROUND_HALF_UP` rounding to 2 decimal places) to eliminate floating-point approximation errors.

### A. Financial Calculation Data Models
- **`FinancialCalculationRequest`**:
  - `project_cost` (Decimal, $> 0$): Total project/business investment required.
  - `own_contribution` (Decimal, $\ge 0$): Promoter/entrepreneur equity or margin money.
  - `annual_interest_rate` (Decimal, $\ge 0$): Nominal annual interest rate in percent (e.g. `9.5`).
  - `tenure_months` (Integer, $> 0$, max 360): Loan repayment period in months.
  - `monthly_income` (Decimal, optional, $\ge 0$): Monthly baseline income for DTI analysis.
  - `existing_monthly_obligations` (Decimal, optional, $\ge 0$): Prior existing debt service.
  - `cost_breakdown` (Object, optional): Itemized breakdown (`machinery_cost`, `working_capital`, `other_costs`).

- **`FinancialCalculationResponse`**:
  - `project_cost`, `own_contribution`, `financing_gap`: Net loan requirement ($\text{cost} - \text{own}$).
  - `financing_percentage`, `own_contribution_percentage`: Structural equity/debt proportions.
  - `emi`: Monthly reducing-balance installment.
  - `repayment_summary`: Principal, monthly installment, total interest, total repayment.
  - `affordability_indicator`: DTI ratio (%), risk level (`LOW_RISK`, `MODERATE_RISK`, `HIGH_RISK`, `UNSPECIFIED`), and plain-language explanation.
  - `cost_breakdown`: Itemized expenditure components.
  - `calculated_at`: ISO 8601 UTC timestamp.

### B. Financial Scenarios Data Models
- **`ScenarioComparisonRequest`**:
  - Base project parameters + array of comparative alternative scenarios (`annual_interest_rate`, `tenure_months`, `scenario_name`).
- **`ScenarioComparisonResponse`**:
  - Base scenario result alongside list of comparative scenarios including delta metrics (`delta_emi_vs_base`, `delta_total_interest_vs_base`).

---

## 3. Scheme Matching & Ranking Engine Data Models `[STEP 6]`

The Scheme Matching & Ranking Engine operates statelessly by evaluating active database scheme records against runtime entrepreneur profiles and Step 4 / Step 5 engine outputs.

### A. Core Matching Enums & Schemas
- **`MatchCategory`** (Enum):
  - `ELIGIBLE`: Scheme satisfies all evaluated mandatory eligibility rules and all compatibility constraints match.
  - `POTENTIALLY_RELEVANT`: No mandatory failure, but critical criteria or profile fields are unverified.
  - `NOT_ELIGIBLE`: One or more mandatory eligibility rules or hard compatibility constraints failed.

- **`DimensionScore`**:
  - `factor` (String): Dimension identifier (`eligibility`, `financial_fit`, `sector_fit`, `stage_fit`, `beneficiary_fit`, `geography_fit`).
  - `status` (`MATCHED`, `FAILED`, `UNVERIFIED`): Evaluation result on this dimension.
  - `weight` (Float): Configured maximum points for this factor (sums to 100.0).
  - `score_awarded` (Float): Points earned ($1.0 \times \text{weight}$ for MATCHED, $0.5 \times \text{weight}$ for UNVERIFIED, $0.0$ for FAILED).
  - `explanation` (String): Deterministic plain-language description of the score contribution.

- **`MatchReasons`**:
  - `positive` (List[String]): Positive alignment facts ("Why this scheme is ranked highly").
  - `negative` (List[String]): Criterion-level failure facts ("Why not currently eligible").
  - `unverified` (List[String]): Unverified parameters or missing profile inputs.

- **`SchemeMatchResult`**:
  - `rank` (Integer, $\ge 1$): Deterministic 1-based shortlist position.
  - `scheme_id` (Integer), `scheme_code` (String), `scheme_name` (String), `nodal_ministry` (String).
  - `match_category` (`MatchCategory`), `match_score` (Float, 0.0 to 100.0), `eligibility_status` (`EligibilityStatus`).
  - `reasons` (`MatchReasons`), `score_breakdown` (List[`DimensionScore`]).
  - `eligibility_summary` (`EligibilitySummary`), `financial_summary` (Optional Object).

- **`SchemeMatchingRequest`**:
  - `profile` (`EntrepreneurProfileInput` / Object): Structured applicant, business, and location attributes.
  - `financial` (`FinancialCalculationRequest` / Object, Optional): Proposed project cost, own equity, loan requirement, income.
  - `limit` (Integer, Default: 10, Range: 1–50): Shortlist result limit.
  - `include_ineligible` (Boolean, Default: True): Whether to include failed schemes with failure explanations.

- **`SchemeMatchingResponse`**:
  - `total_schemes_evaluated` (Integer), `eligible_count` (Integer), `potentially_relevant_count` (Integer), `not_eligible_count` (Integer).
  - `results` (List[`SchemeMatchResult`]): Ranked scheme shortlist.
  - `disclaimer` (String): Required regulatory non-guarantee notice.
  - `evaluated_at` (ISO 8601 UTC Timestamp).

---

### F. `entrepreneurs` `[ACTIVE / STEP 7]`
Core applicant entity representing an entrepreneur or self-employed individual.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-Increment | Unique entrepreneur record ID |
| `full_name` | `VARCHAR(255)` | INDEXED, NOT NULL | Full name of the applicant |
| `date_of_birth` | `DATE` | NULLABLE | Date of birth |
| `age` | `INTEGER` | NULLABLE | Age in completed years |
| `gender` | `VARCHAR(50)` | NULLABLE | Gender (`male`, `female`, `other`, `prefer_not_to_say`) |
| `category` | `VARCHAR(50)` | NULLABLE | Social category (`General`, `SC`, `ST`, `OBC`, `Minorities`) |
| `preferred_language` | `VARCHAR(20)` | NOT NULL, Default: `'en'` | Preferred interface/communication language |
| `phone_number` | `VARCHAR(20)` | NULLABLE | 10-digit mobile contact number |
| `email` | `VARCHAR(255)` | NULLABLE | Email address |
| `state` | `VARCHAR(100)` | INDEXED, NULLABLE | State / UT of residence |
| `district` | `VARCHAR(100)` | NULLABLE | District |
| `city` | `VARCHAR(100)` | NULLABLE | City / Town / Village |
| `pincode` | `VARCHAR(10)` | NULLABLE | 6-digit postal PIN code |
| `area_type` | `VARCHAR(50)` | NULLABLE | Area type (`urban`, `rural`, `peri_urban`) |
| `latitude` | `NUMERIC(9,6)` | NULLABLE | Geographic latitude |
| `longitude` | `NUMERIC(9,6)` | NULLABLE | Geographic longitude |
| `is_active` | `BOOLEAN` | NOT NULL, Default: `true` | Active status flag |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Last update timestamp |

---

### G. `business_profiles` `[ACTIVE / STEP 7]`
Enterprise profile representing an existing or proposed micro/small business initiative.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-Increment | Unique business profile ID |
| `entrepreneur_id` | `INTEGER` | Foreign Key (`entrepreneurs.id` ON DELETE CASCADE), INDEXED | Parent entrepreneur reference |
| `business_name` | `VARCHAR(255)` | NULLABLE | Registered or trade enterprise name |
| `business_type` | `VARCHAR(100)` | NULLABLE | Constitution (`proprietorship`, `partnership`, `self_employed`) |
| `sector` | `VARCHAR(100)` | INDEXED, NULLABLE | Sector (`manufacturing`, `services`, `trading`, `handicrafts`, `agro_allied`) |
| `sub_sector` | `VARCHAR(150)` | NULLABLE | Specific industry trade or activity |
| `business_stage` | `VARCHAR(50)` | NULLABLE | Enterprise phase (`idea`, `new_enterprise`, `expansion`) |
| `business_description` | `TEXT` | NULLABLE | Business activities summary |
| `existing_business_vintage_years` | `INTEGER` | NULLABLE | Operational vintage in years |
| `is_greenfield` | `BOOLEAN` | NULLABLE | New first-time setup flag |
| `has_vending_proof` | `BOOLEAN` | NULLABLE | PM SVANidhi vending certificate / ID |
| `is_notified_trade` | `BOOLEAN` | NULLABLE | PM Vishwakarma 18 notified artisan trade check |
| `is_single_family_applicant` | `BOOLEAN` | NULLABLE | Sole applicant per family check |
| `has_govt_employee_in_family` | `BOOLEAN` | NULLABLE | Family government employee check |
| `availed_pmegp_mudra_last_5yr` | `BOOLEAN` | NULLABLE | Prior central credit check |
| `is_non_farm_income_generating` | `BOOLEAN` | NULLABLE | Non-farm micro-enterprise check |
| `is_defaulter` | `BOOLEAN` | Default: `false`, NULLABLE | Past default history flag |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Last update timestamp |

---

### H. `financial_profiles` `[ACTIVE / STEP 7]`
Financial inputs profile storing user-provided investment requirements and income parameters.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-Increment | Unique financial profile ID |
| `entrepreneur_id` | `INTEGER` | Foreign Key (`entrepreneurs.id` ON DELETE CASCADE), INDEXED | Parent entrepreneur reference |
| `business_profile_id` | `INTEGER` | Foreign Key (`business_profiles.id` ON DELETE SET NULL), NULLABLE | Associated business profile reference |
| `project_cost` | `NUMERIC(14,2)`| NULLABLE | Estimated total project investment cost |
| `own_contribution` | `NUMERIC(14,2)`| Default: `0.00`, NULLABLE | Promoter equity contribution |
| `loan_requirement` | `NUMERIC(14,2)`| NULLABLE | Desired loan assistance |
| `annual_income` | `NUMERIC(14,2)`| NULLABLE | Total annual household/business income |
| `monthly_income` | `NUMERIC(14,2)`| NULLABLE | Average monthly net income |
| `existing_monthly_obligations` | `NUMERIC(14,2)`| Default: `0.00`, NULLABLE | Current debt repayments |
| `machinery_equipment_cost` | `NUMERIC(14,2)`| NULLABLE | Equipment cost breakdown |
| `infrastructure_cost` | `NUMERIC(14,2)`| NULLABLE | Infrastructure/civil cost breakdown |
| `working_capital_cost` | `NUMERIC(14,2)`| NULLABLE | Working capital breakdown |
| `other_expenses_cost` | `NUMERIC(14,2)`| NULLABLE | Contingency/license cost breakdown |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Last update timestamp |

---

## 3. Scheme Discovery, Explainability & Comparison Contracts `[STEP 8]`

### A. Match Categories & Numeric Score Scale
- **`ELIGIBLE` (Strong Match)**: All mandatory rules satisfied; high sector, stage, geographic, and financial compatibility. Rendered in Emerald Green (`#059669`).
- **`POTENTIALLY_RELEVANT` (Needs Verification)**: Profile is missing certain fields or has unverified criteria, but no mandatory failures. Rendered in Amber/Orange (`#d97706`).
- **`NOT_ELIGIBLE` (Not Currently Eligible)**: Failed at least one mandatory rule or hard sector/stage constraint. Rendered in Slate Gray / Crimson (`#dc2626`).
- **Match Score**: Scaled float from `0.0` to `100.0` representing multi-dimensional fit.

### B. Criterion Evaluation Record (`CriterionEvaluation`)
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `rule_id` | `INTEGER` | Database ID of the scheme rule |
| `rule_code` | `VARCHAR` | Unique identifier (e.g. `'PMEGP_MIN_AGE'`) |
| `criterion` | `VARCHAR` | Evaluated attribute name |
| `status` | `VARCHAR` | Evaluation outcome (`MATCHED`, `FAILED`, `UNVERIFIED`) |
| `user_value` | `ANY` | Normalized profile value provided by applicant |
| `required_condition` | `VARCHAR` | Formatted condition string (e.g. `'>= 18'`) |
| `explanation` | `VARCHAR` | Deterministic explanation of the evaluation outcome |
| `is_mandatory` | `BOOLEAN` | Whether failure marks the scheme overall as `FAILED` |
| `source_name` | `VARCHAR` | Gazette / guideline citation title |
| `source_url` | `VARCHAR` | Accessible government URL |

### I. `district_msme_ecosystems` `[ACTIVE / STEP 9]`
District-level MSME ecosystem metadata, industrial density, and District Industries Centre (DIC) office support details.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-Increment | Unique district ecosystem ID |
| `state_name` | `VARCHAR(100)` | INDEXED, NOT NULL | State name (e.g. `'Maharashtra'`) |
| `district_name` | `VARCHAR(100)` | INDEXED, NOT NULL | District name (e.g. `'Pune'`) |
| `state_code` | `VARCHAR(10)` | NULLABLE | 2-letter state abbreviation |
| `district_code` | `VARCHAR(20)` | NULLABLE | Census / LGD district code |
| `tier` | `VARCHAR(20)` | NULLABLE | Urban tier classification (`Tier 1`, `Tier 2`, `Tier 3`) |
| `category` | `VARCHAR(50)` | NULLABLE | Geographic category (`General`, `Aspirational`, `Hilly/NER`) |
| `industrial_density_score` | `INTEGER` | NULLABLE | Verified MSME density index (0–100) |
| `prominent_sectors` | `JSON` | Default: `[]`, NOT NULL | List of active industrial / manufacturing sectors |
| `thrust_sectors` | `JSON` | Default: `[]`, NOT NULL | State/District priority thrust sectors eligible for special benefits |
| `infrastructure_highlights`| `TEXT` | NULLABLE | Power, water, logistics, and rail connectivity highlights |
| `dic_office_address` | `TEXT` | NULLABLE | Official District Industries Centre (DIC) office address |
| `dic_contact_phone` | `VARCHAR(50)` | NULLABLE | DIC nodal officer contact telephone |
| `dic_contact_email` | `VARCHAR(100)` | NULLABLE | DIC official nodal support email |
| `latitude` | `NUMERIC(9,6)` | NULLABLE | District center latitude |
| `longitude` | `NUMERIC(9,6)` | NULLABLE | District center longitude |
| `location` | `GEOMETRY(POINT, 4326)` | Spatial Index (GIST) | PostGIS spatial point for proximity queries |
| `data_confidence` | `VARCHAR(50)` | NOT NULL, Default: `'VERIFIED'` | Provenance tag (`VERIFIED`, `ESTIMATED`, `UNVERIFIED`) |
| `source_name` | `VARCHAR(255)` | NOT NULL | Official data agency (e.g. `'Ministry of MSME - District Industrial Profile'`) |
| `source_url` | `VARCHAR(500)` | NULLABLE | URL reference to official profile document |
| `source_version` | `VARCHAR(50)` | NOT NULL, Default: `'2024-25'` | Edition / census year |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Last update timestamp |

---

### J. `msme_clusters` `[ACTIVE / STEP 9]`
Registered industrial and artisan clusters under Micro and Small Enterprises Cluster Development Programme (MSE-CDP) or State MSME departments.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-Increment | Unique cluster ID |
| `cluster_code` | `VARCHAR(50)` | UNIQUE, NOT NULL | Machine-readable cluster code (e.g. `'PUNE_AUTO_COMP'`) |
| `cluster_name` | `VARCHAR(255)` | NOT NULL | Official cluster title |
| `state_name` | `VARCHAR(100)` | INDEXED, NOT NULL | State name |
| `district_name` | `VARCHAR(100)` | INDEXED, NOT NULL | District name |
| `sector` | `VARCHAR(100)` | INDEXED, NOT NULL | Primary sector (`manufacturing`, `handicrafts`, `textiles`, etc.) |
| `sub_sector` | `VARCHAR(150)` | NULLABLE | Specific sub-trade (e.g. `'auto_components'`) |
| `cluster_type` | `VARCHAR(50)` | NULLABLE | Type (`Industrial`, `Artisan`, `Service`, `Agro-Processing`) |
| `specialization` | `TEXT` | NULLABLE | Technical and manufacturing specialization summary |
| `key_products` | `JSON` | Default: `[]`, NOT NULL | List of core manufactured goods / products |
| `raw_material_access` | `VARCHAR(50)` | NULLABLE | Access rating (`High`, `Moderate`, `Low`) |
| `market_linkage` | `VARCHAR(50)` | NULLABLE | Market access rating (`High`, `Moderate`, `Low`) |
| `common_facility_centers` | `JSON` | Default: `[]`, NOT NULL | Available shared testing / tooling CFCs |
| `latitude` | `NUMERIC(9,6)` | NOT NULL | Cluster center latitude |
| `longitude` | `NUMERIC(9,6)` | NOT NULL | Cluster center longitude |
| `location` | `GEOMETRY(POINT, 4326)` | Spatial Index (GIST) | PostGIS spatial point for proximity calculation |
| `data_confidence` | `VARCHAR(50)` | NOT NULL, Default: `'VERIFIED'` | Provenance tag (`VERIFIED`, `ESTIMATED`, `UNVERIFIED`) |
| `source_agency` | `VARCHAR(255)` | NOT NULL | Reporting agency (e.g. `'MSME-CDP / Development Commissioner (MSME)'`) |
| `source_url` | `VARCHAR(500)` | NULLABLE | Official URL |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Last update timestamp |

---

## 4. Business Feasibility & Signal Taxonomy `[STEP 9]`

### A. Signal Categories (`SignalCategory`)
- `LOCATION_SIGNAL`: MSME industrial density, proximity to registered clusters, and DIC support.
- `SECTOR_SIGNAL`: Trade compatibility with district thrust sectors and local raw materials.
- `BUSINESS_STAGE_SIGNAL`: Enterprise readiness (greenfield vs expansion).
- `FINANCIAL_FEASIBILITY_SIGNAL`: Equity contribution ratio ($\ge 10-25\%$) and debt service capacity.
- `DATA_COMPLETENESS_SIGNAL`: Profile completeness for computing verified signals.
- `RISK_SIGNAL`: Adverse credit flags (loan default, high leverage, unsustainable debt service).

### B. Feasibility Outcomes (`FeasibilityOutcome`)
- `FAVOURABLE`: High cluster alignment, verified thrust sector match, healthy equity, and low leverage.
- `CAUTION`: Viable concept with actionable caution flags (e.g. new trade, high initial debt service).
- `HIGH_RISK`: Critical financial stress (e.g. default history, excessive leverage).
- `INSUFFICIENT_DATA`: Returned whenever mandatory context is missing (never hallucinating fake stats).

### C. Data Confidence Status (`DataConfidenceStatus`)
- `VERIFIED`: Official government agency data (Ministry of MSME / MSE-CDP / Census).
- `ESTIMATED`: Derived benchmark or standard empirical guideline.
- `UNVERIFIED`: Self-reported applicant inputs.
- `INSUFFICIENT_DATA`: Missing required attributes.

---

---

## 5. Channel Partners & Application Tracking Entities `[STEP 10]`

### A. `channel_partners`
Stores verified financial institutions, government nodal agencies, DICs, and facilitation centres.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PRIMARY KEY, Default: `gen_random_uuid()` | Unique partner ID |
| `partner_name` | `VARCHAR(255)` | NOT NULL | Partner/institution name (e.g. `'District Industries Centre (DIC) Pune'`) |
| `partner_type` | `VARCHAR(50)` | NOT NULL | Type (`GOVERNMENT_AGENCY`, `PUBLIC_SECTOR_BANK`, `PRIVATE_BANK`, `REGIONAL_RURAL_BANK`, `CSC_CENTER`, `NBFC_MFI`) |
| `organization_name` | `VARCHAR(255)` | NOT NULL | Parent organization (e.g. `'Directorate of Industries, Maharashtra'`) |
| `branch_code` | `VARCHAR(100)` | NULLABLE | Branch identifier / IFSC / office code |
| `address` | `TEXT` | NOT NULL | Physical address |
| `city` | `VARCHAR(100)` | NOT NULL | City |
| `district` | `VARCHAR(100)` | NOT NULL, Indexed | District |
| `state` | `VARCHAR(100)` | NOT NULL, Indexed | State |
| `pincode` | `VARCHAR(10)` | NOT NULL | 6-digit postal code |
| `latitude` | `NUMERIC(9,6)` | NOT NULL | Partner location latitude |
| `longitude` | `NUMERIC(9,6)` | NOT NULL | Partner location longitude |
| `location` | `GEOMETRY(POINT, 4326)` | Spatial Index (GIST) | PostGIS spatial point for proximity calculation |
| `phone_number` | `VARCHAR(50)` | NULLABLE | Contact telephone / mobile |
| `email` | `VARCHAR(255)` | NULLABLE | Official email address |
| `website_url` | `VARCHAR(500)` | NULLABLE | Official portal URL |
| `nodal_officer_name` | `VARCHAR(255)` | NULLABLE | Designated officer name |
| `nodal_officer_designation`| `VARCHAR(255)` | NULLABLE | Officer designation |
| `supported_services` | `JSONB` | NOT NULL, Default: `[]` | List of services provided (`DPR_ASSISTANCE`, `LOAN_PROCESSING`, etc.) |
| `operating_hours` | `VARCHAR(255)` | NULLABLE | Working hours |
| `verification_status` | `VARCHAR(50)` | NOT NULL, Default: `'VERIFIED'` | Verification status (`VERIFIED`, `PROVISIONAL`, `UNVERIFIED`) |
| `is_active` | `BOOLEAN` | NOT NULL, Default: `true` | Active partner flag |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Last update timestamp |

### B. `scheme_channel_partners`
Associates schemes with approved implementing agencies and lending banks.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PRIMARY KEY, Default: `gen_random_uuid()` | Unique link ID |
| `scheme_id` | `UUID` | NOT NULL, Foreign Key (`schemes.id`, CASCADE), Indexed | Associated scheme |
| `channel_partner_id` | `UUID` | NOT NULL, Foreign Key (`channel_partners.id`, CASCADE), Indexed | Associated partner |
| `partner_role` | `VARCHAR(50)` | NOT NULL, Default: `'IMPLEMENTING_AGENCY'` | Role (`IMPLEMENTING_AGENCY`, `LENDING_PARTNER`, `NODAL_AGENCY`, `APPLICATION_FACILITATOR`) |
| `is_primary` | `BOOLEAN` | NOT NULL, Default: `false` | Primary nodal partner flag |
| `priority_order` | `INTEGER` | NOT NULL, Default: `0` | Ordering priority (lower = higher priority) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Creation timestamp |

### C. `applications`
Tracks entrepreneur scheme loan applications.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PRIMARY KEY, Default: `gen_random_uuid()` | Unique application tracking ID |
| `profile_id` | `UUID` | NOT NULL, Foreign Key (`entrepreneurs.id`, CASCADE), Indexed | Applicant entrepreneur |
| `scheme_id` | `UUID` | NOT NULL, Foreign Key (`schemes.id`, RESTRICT), Indexed | Target scheme |
| `channel_partner_id` | `UUID` | NULLABLE, Foreign Key (`channel_partners.id`, SET NULL), Indexed | Assigned channel partner |
| `status` | `VARCHAR(50)` | NOT NULL, Default: `'DRAFT'`, Indexed | Current status (`DRAFT`, `DOCUMENT_PREPARATION`, `PARTNER_ASSIGNED`, `APPLICATION_SUBMITTED`, `UNDER_REVIEW`, `SANCTIONED`, `DISBURSED`, `REJECTED`, `WITHDRAWN`) |
| `sub_status` | `VARCHAR(100)` | NULLABLE | Detailed sub-status |
| `portal_application_id` | `VARCHAR(100)` | NULLABLE | Portal acknowledgement number |
| `loan_amount_requested` | `NUMERIC(14,2)` | NULLABLE | Requested loan principal |
| `loan_amount_sanctioned`| `NUMERIC(14,2)` | NULLABLE | Approved loan amount |
| `subsidy_amount_expected`| `NUMERIC(14,2)` | NULLABLE | Expected subsidy amount |
| `subsidy_amount_sanctioned`| `NUMERIC(14,2)` | NULLABLE | Disbursed/credited subsidy |
| `project_cost` | `NUMERIC(14,2)` | NULLABLE | Total project cost |
| `own_contribution` | `NUMERIC(14,2)` | NULLABLE | Promoter equity contribution |
| `target_bank_name` | `VARCHAR(255)` | NULLABLE | Target financing bank |
| `target_branch` | `VARCHAR(255)` | NULLABLE | Bank branch |
| `application_notes` | `TEXT` | NULLABLE | Applicant notes |
| `submission_date` | `TIMESTAMPTZ` | NULLABLE | Date of formal portal submission |
| `sanction_date` | `TIMESTAMPTZ` | NULLABLE | Date of loan sanction |
| `disbursement_date` | `TIMESTAMPTZ` | NULLABLE | Date of fund disbursement |
| `rejection_reason` | `TEXT` | NULLABLE | Reason if rejected |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, UTC | Last update timestamp |

### D. `application_status_history`
Maintains an immutable chronological audit trail of all application status transitions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PRIMARY KEY, Default: `gen_random_uuid()` | Unique history event ID |
| `application_id` | `UUID` | NOT NULL, Foreign Key (`applications.id`, CASCADE), Indexed | Associated application |
| `status` | `VARCHAR(50)` | NOT NULL | Milestone status |
| `sub_status` | `VARCHAR(100)` | NULLABLE | Granular sub-status |
| `remarks` | `TEXT` | NULLABLE | Progress remarks / milestone details |
| `action_required` | `TEXT` | NULLABLE | Action needed by applicant |
| `next_step` | `TEXT` | NULLABLE | Expected upcoming process |
| `source_type` | `VARCHAR(50)` | NOT NULL, Default: `'USER_RECORDED'` | Source attribution (`USER_RECORDED`, `PARTNER_UPDATED`, `OFFICIAL_PORTAL`) |
| `updated_by` | `VARCHAR(255)` | NULLABLE | Author of update |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, UTC, Indexed | Transition timestamp |

---

## 6. Planned / Future Conceptual Entities (Step 11+ Implementation)

> [!IMPORTANT]
> The following entities are **PLANNED CONCEPTUAL DESIGNS** for subsequent milestones.
> They are intentionally **NOT** created in the database during Step 10.

- **`grounded_guidelines_index`** `[PLANNED / STEP 11]`: Vector / text chunks of official scheme policy guidelines.
- **`conversations` / `copilot_context`** `[PLANNED / STEP 12]`: Post-loan AI advisor chat sessions.

---

## 7. Data Integrity & Anti-Hallucination Principles

1. **Strict Authoritative Grounding**: All scheme, cluster, and partner parameters must reference official ministry URLs and gazette citations.
2. **Deterministic Computations**: Eligibility rules, financial formulas, matching scores, feasibility signals, and partner matching are evaluated in pure code/SQL, never in LLMs.
3. **Auditability**: Every scheme and cluster change preserves version metadata and `last_verified_at` timestamps; application status transitions are recorded in an immutable history ledger.
4. **Anti-Fake Tracking Guarantee**: All application status entries explicitly identify `source_type` (`USER_RECORDED`), prohibiting simulated or fabricated government portal responses.
5. **Regulatory Disclaimers**: Non-guarantee disclaimers accompany all match score, financial, feasibility, and application tracking views.


