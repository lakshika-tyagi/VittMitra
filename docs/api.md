# VittMitra API Specifications & Contracts

## 1. Conventions & Standards

- **Base URL Prefix**: `/api/v1` (with convenience root shortcuts for health, schemes, and eligibility)
- **Data Format**: `application/json`
- **Authentication**: Public endpoints (Auth introduced in future milestone)
- **Status Codes**:
  - `200 OK`: Request succeeded
  - `404 Not Found`: Scheme or resource does not exist
  - `422 Unprocessable Entity`: Request body validation error
  - `503 Service Unavailable`: Dependent service (e.g. database) unreachable

---

## 2. Implemented Endpoints (Milestones 1, 2, 3, & 4)

### System & Database Health
- `GET /health` or `GET /api/v1/health` — Service heartbeat.
- `GET /health/db` or `GET /api/v1/health/db` — PostgreSQL database connectivity probe.
- `GET /health/postgis` or `GET /api/v1/health/postgis` — PostGIS geospatial extension probe.

---

### Scheme Knowledge Discovery (Read-Only)

#### `GET /api/v1/schemes` (or `GET /schemes`)
List all verified active government schemes with summary metadata.

**Query Parameters (Optional)**:
- `sector` (string, e.g. `manufacturing`, `services`, `trading`, `handicrafts`)
- `beneficiary` (string, e.g. `SC`, `ST`, `Women`, `OBC`)

---

#### `GET /api/v1/schemes/{scheme_identifier}` (or `GET /schemes/{scheme_identifier}`)
Retrieve comprehensive scheme specifications by database ID or unique scheme code (`PMEGP`, `STANDUP_INDIA`, `MUDRA_PMMY`, `PM_SVANIDHI`, `PM_VISHWAKARMA`).

---

### Deterministic Scheme Eligibility Engine `[STEP 4]`

#### `POST /api/v1/eligibility/check` (or `POST /eligibility/check`)
Evaluates an entrepreneur's structured profile inputs against official government scheme rules stored in the database.

> [!NOTE]
> This endpoint is completely deterministic and explainable. No LLM or generative AI model is involved in decision-making.

**Request Payload**:
```json
{
  "scheme_id": "PMEGP",
  "profile": {
    "age": 27,
    "gender": "female",
    "category": "OBC",
    "business_stage": "new_enterprise",
    "sector": "manufacturing",
    "area_type": "rural",
    "is_defaulter": false
  }
}
```

**Request Parameters**:
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `scheme_id` | `string \| integer` | Yes | Target scheme database ID (e.g. `1`) or unique scheme code (e.g. `"PMEGP"`) |
| `profile` | `object` | Yes | Structured applicant and business attributes (e.g. `age`, `category`, `gender`, `business_stage`, `sector`, `area_type`, `annual_income`, `is_defaulter`, etc.) |

**Response Example (200 OK — MATCHED)**:
```json
{
  "scheme_id": 1,
  "scheme_code": "PMEGP",
  "scheme_name": "Prime Minister's Employment Generation Programme",
  "overall_status": "MATCHED",
  "evaluated_at": "2026-09-07T12:00:00Z",
  "summary": {
    "total_rules": 4,
    "matched_count": 4,
    "failed_count": 0,
    "unverified_count": 0
  },
  "criteria": [
    {
      "rule_id": 1,
      "rule_code": "PMEGP_MIN_AGE",
      "criterion": "age",
      "status": "MATCHED",
      "user_value": 27,
      "required_condition": ">= 18",
      "explanation": "Applicant age is 27; meets required minimum of >= 18.",
      "is_mandatory": true,
      "source_id": 1,
      "source_name": "Ministry of MSME - PMEGP Scheme Guidelines",
      "source_url": "https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp",
      "rule_version": "1.0"
    },
    {
      "rule_id": 2,
      "rule_code": "PMEGP_UNIT_STAGE",
      "criterion": "business_stage",
      "status": "MATCHED",
      "user_value": "new_enterprise",
      "required_condition": "== new_enterprise",
      "explanation": "Applicant business stage is new_enterprise; satisfies requirement of == new_enterprise.",
      "is_mandatory": true,
      "source_id": 1,
      "source_name": "Ministry of MSME - PMEGP Scheme Guidelines",
      "source_url": "https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp",
      "rule_version": "1.0"
    }
  ]
}
```

**Response Fields**:
| Field | Type | Description |
| :--- | :--- | :--- |
| `scheme_id` | `integer` | Database scheme ID |
| `scheme_code` | `string` | Unique scheme code |
| `scheme_name` | `string` | Official scheme title |
| `overall_status` | `string` | Aggregated result: `MATCHED`, `FAILED`, or `UNVERIFIED` |
| `evaluated_at` | `string (ISO 8601)` | Evaluation UTC timestamp |
| `summary` | `object` | Total rules, matched, failed, and unverified counts |
| `criteria` | `array[object]` | Individual criterion evaluation details with explanation and source links |

---

### Deterministic Financial Engine `[STEP 5]`

#### `POST /api/v1/finance/calculate` (or `POST /finance/calculate`)
Computes transparent loan repayment metrics, reducing-balance EMI amortization, project cost breakdown, financing gap, and affordability (DTI) indicators.

**Request Payload**:
```json
{
  "project_cost": 1000000,
  "own_contribution": 100000,
  "annual_interest_rate": 9.5,
  "tenure_months": 60,
  "monthly_income": 45000,
  "existing_monthly_obligations": 5000,
  "cost_breakdown": {
    "machinery_cost": 600000,
    "working_capital": 300000,
    "other_costs": 100000
  }
}
```

**Response Example (200 OK)**:
```json
{
  "project_cost": 1000000.0,
  "own_contribution": 100000.0,
  "financing_gap": 900000.0,
  "financing_percentage": 90.0,
  "own_contribution_percentage": 10.0,
  "annual_interest_rate": 9.5,
  "tenure_months": 60,
  "emi": 18911.39,
  "repayment_summary": {
    "principal_amount": 900000.0,
    "monthly_emi": 18911.39,
    "total_interest": 234683.4,
    "total_repayment": 1134683.4,
    "tenure_months": 60,
    "annual_interest_rate": 9.5
  },
  "affordability_indicator": {
    "monthly_income": 45000.0,
    "existing_obligations": 5000.0,
    "proposed_emi": 18911.39,
    "total_monthly_obligations": 23911.39,
    "debt_to_income_ratio": 53.14,
    "affordability_category": "HIGH_RISK",
    "explanation": "Total monthly debt obligations (Rs. 23,911.39) represent 53.14% of monthly income (Rs. 45,000.00). DTI exceeds 50.0%, indicating high financial stress and elevated risk of loan default."
  },
  "cost_breakdown": {
    "machinery_cost": 600000.0,
    "working_capital": 300000.0,
    "other_costs": 100000.0,
    "total_cost": 1000000.0
  },
  "calculated_at": "2026-09-07T12:00:00Z"
}
```

---

#### `POST /api/v1/finance/scenarios` (or `POST /finance/scenarios`)
Evaluates comparative financial scenarios (Base, Conservative $+1.5\%$, Optimistic $-1.5\%$, or custom variations) for interest rates and tenures.

**Request Payload**:
```json
{
  "project_cost": 1000000,
  "own_contribution": 100000,
  "base_annual_interest_rate": 9.5,
  "base_tenure_months": 60,
  "monthly_income": 45000,
  "scenarios": [
    {
      "scenario_name": "Conservative (+1.5% Rate)",
      "annual_interest_rate": 11.0,
      "tenure_months": 60
    },
    {
      "scenario_name": "Optimistic (-1.5% Rate)",
      "annual_interest_rate": 8.0,
      "tenure_months": 60
    }
  ]
}
```

**Response Example (200 OK)**:
```json
{
  "project_cost": 1000000.0,
  "own_contribution": 100000.0,
  "financing_gap": 900000.0,
  "base_scenario": {
    "scenario_name": "Base Scenario",
    "annual_interest_rate": 9.5,
    "tenure_months": 60,
    "monthly_emi": 18911.39,
    "total_interest": 234683.4,
    "total_repayment": 1134683.4,
    "debt_to_income_ratio": 42.03,
    "affordability_category": "MODERATE_RISK"
  },
  "scenarios": [
    {
      "scenario_name": "Conservative (+1.5% Rate)",
      "annual_interest_rate": 11.0,
      "tenure_months": 60,
      "monthly_emi": 19567.89,
      "total_interest": 274073.4,
      "total_repayment": 1174073.4,
      "debt_to_income_ratio": 43.48,
      "affordability_category": "MODERATE_RISK",
      "delta_emi_vs_base": 656.5,
      "delta_total_interest_vs_base": 39390.0
    }
  ],
  "calculated_at": "2026-09-07T12:00:00Z"
}
```

---

### Explainable Scheme Matching & Ranking Engine `[STEP 6]`

#### `POST /api/v1/matching/schemes` (or `POST /matching/schemes`)
Evaluates active government schemes against structured entrepreneur, business, geographic, and financial inputs. Returns deterministically ranked scheme shortlists with transparent match scores, score contribution breakdowns, and criterion-level reasons ("Why this scheme?", "Why not currently eligible?").

> [!NOTE]
> This endpoint is completely deterministic and explainable. ZERO AI / LLM models participate in scoring or ranking.
> **Disclaimer**: *"Match Score is a VittMitra relevance/ranking indicator and is not an official government eligibility or loan-approval score."*

**Request Payload**:
```json
{
  "profile": {
    "age": 28,
    "gender": "female",
    "category": "SC",
    "state": "Maharashtra",
    "business_stage": "new_enterprise",
    "sector": "manufacturing",
    "area_type": "rural"
  },
  "financial": {
    "project_cost": 1500000,
    "own_contribution": 250000,
    "loan_amount": 1250000,
    "annual_interest_rate": 9.5,
    "tenure_months": 60,
    "monthly_income": 50000
  },
  "limit": 5,
  "include_ineligible": true
}
```

**Request Parameters**:
| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `profile` | `object` | Yes | — | Structured applicant and business profile inputs (`age`, `gender`, `category`, `state`, `sector`, `business_stage`, etc.) |
| `financial` | `object` | No | `null` | Optional financial parameters (`project_cost`, `own_contribution`, `loan_amount`, `annual_interest_rate`, `tenure_months`, `monthly_income`) |
| `limit` | `integer` | No | `10` | Maximum number of ranked scheme results to return (1–50) |
| `include_ineligible` | `boolean` | No | `true` | Whether to include `NOT_ELIGIBLE` schemes with failure explanations |

**Response Example (200 OK)**:
```json
{
  "total_schemes_evaluated": 5,
  "eligible_count": 2,
  "potentially_relevant_count": 2,
  "not_eligible_count": 1,
  "results": [
    {
      "rank": 1,
      "scheme_id": 1,
      "scheme_code": "PMEGP",
      "scheme_name": "Prime Minister's Employment Generation Programme",
      "nodal_ministry": "Ministry of Micro, Small and Medium Enterprises",
      "match_category": "ELIGIBLE",
      "match_score": 100.0,
      "eligibility_status": "MATCHED",
      "reasons": {
        "positive": [
          "All 4 evaluated mandatory eligibility criteria matched.",
          "Your proposed project requirement (₹15,00,000.00) fits within verified scheme financial parameters.",
          "Your business sector 'manufacturing' matches the scheme's supported sectors.",
          "Your business stage 'new_enterprise' matches the scheme's targeted enterprise phase.",
          "Your demographic profile matches the scheme's targeted beneficiary groups.",
          "Scheme applies nationally across all States and Union Territories, including Maharashtra."
        ],
        "negative": [],
        "unverified": []
      },
      "score_breakdown": [
        {
          "factor": "eligibility",
          "status": "MATCHED",
          "weight": 35.0,
          "score_awarded": 35.0,
          "explanation": "All 4 evaluated mandatory eligibility criteria matched."
        },
        {
          "factor": "financial_fit",
          "status": "MATCHED",
          "weight": 20.0,
          "score_awarded": 20.0,
          "explanation": "Your proposed project requirement (₹15,00,000.00) fits within verified scheme financial parameters."
        },
        {
          "factor": "sector_fit",
          "status": "MATCHED",
          "weight": 15.0,
          "score_awarded": 15.0,
          "explanation": "Your business sector 'manufacturing' matches the scheme's supported sectors."
        },
        {
          "factor": "stage_fit",
          "status": "MATCHED",
          "weight": 10.0,
          "score_awarded": 10.0,
          "explanation": "Your business stage 'new_enterprise' matches the scheme's targeted enterprise phase."
        },
        {
          "factor": "beneficiary_fit",
          "status": "MATCHED",
          "weight": 10.0,
          "score_awarded": 10.0,
          "explanation": "Your demographic profile matches the scheme's targeted beneficiary groups."
        },
        {
          "factor": "geography_fit",
          "status": "MATCHED",
          "weight": 10.0,
          "score_awarded": 10.0,
          "explanation": "Scheme applies nationally across all States and Union Territories, including Maharashtra."
        }
      ],
      "eligibility_summary": {
        "total_rules": 4,
        "matched_count": 4,
        "failed_count": 0,
        "unverified_count": 0
      },
      "financial_summary": {
        "project_cost": 1500000.0,
        "own_contribution": 250000.0,
        "own_contribution_pct": 16.67,
        "financing_gap": 1250000.0,
        "principal": 1250000.0,
        "estimated_emi": 26265.82,
        "annual_interest_rate": 9.5,
        "tenure_months": 60,
        "affordability_status": "SUFFICIENT_DATA"
      }
    }
  ],
  "disclaimer": "Match Score is a VittMitra relevance/ranking indicator and is not an official government eligibility or loan-approval score.",
  "evaluated_at": "2026-09-07T12:00:00Z"
}
```

---

### Entrepreneur Onboarding & Profile Foundation `[STEP 7]`

#### `POST /api/v1/profiles`
Creates an entrepreneur record along with optional business profile and financial parameters in a single unified submission.

**Request Payload (`UnifiedProfileCreate`)**:
```json
{
  "entrepreneur": {
    "full_name": "Priya Sharma",
    "age": 28,
    "gender": "female",
    "category": "OBC",
    "preferred_language": "en",
    "phone_number": "9876543210",
    "state": "Maharashtra",
    "district": "Pune",
    "city": "Pune",
    "pincode": "411001",
    "area_type": "rural"
  },
  "business": {
    "business_name": "Sahyadri Spices",
    "business_type": "proprietorship",
    "sector": "manufacturing",
    "sub_sector": "food_processing",
    "business_stage": "new_enterprise",
    "is_greenfield": true
  },
  "financial": {
    "project_cost": 1500000,
    "own_contribution": 250000,
    "loan_requirement": 1250000,
    "monthly_income": 45000,
    "existing_monthly_obligations": 5000
  }
}
```

#### `GET /api/v1/profiles/{profile_id}`
Retrieves full profile hierarchy (personal, business, financial) with dynamically calculated completeness metrics.

#### `PUT /api/v1/profiles/{profile_id}`
Updates personal or geographic attributes of the entrepreneur.

#### `DELETE /api/v1/profiles/{profile_id}`
Permanently deletes entrepreneur record and cascades deletion to all associated business and financial records.

#### `POST /api/v1/profiles/{profile_id}/business`
Adds a new business profile to the specified entrepreneur.

#### `POST /api/v1/profiles/{profile_id}/financial`
Adds a new financial profile with raw financial inputs.

#### `GET /api/v1/profiles/{profile_id}/eligibility/{scheme_id}`
Executes Step 4 Deterministic Eligibility Engine for the stored profile against the target scheme code or ID.

#### `GET /api/v1/profiles/{profile_id}/finance/summary`
Executes Step 5 Deterministic Financial Engine for the stored profile.

#### `GET /api/v1/profiles/{profile_id}/matching`
Executes Step 6 Explainable Scheme Matching & Ranking Engine for the stored profile.

---

### Personalized Scheme Discovery & Comparison `[STEP 8]`

Step 8 introduces the Next.js frontend consumer contracts utilizing the above endpoints:

1. **Schemes Discovery View (`/schemes`)**:
   - `fetchSchemes()` -> `GET /api/v1/schemes` (Public schemes directory)
   - `getProfileMatching(profileId)` -> `GET /api/v1/profiles/{profile_id}/matching` (Personalized ranked matches)
   - `listProfiles()` -> `GET /api/v1/profiles` (Active entrepreneur switcher)

2. **Scheme Details View (`/schemes/[scheme_id]`)**:
   - `fetchSchemeDetail(idOrCode)` -> `GET /api/v1/schemes/{idOrCode}` (Full metadata, sources, rules, documents)
   - `getProfileEligibility(profileId, schemeCode)` -> `GET /api/v1/profiles/{profile_id}/eligibility/{scheme_code}` (Criterion breakdown)
   - `getProfileFinanceSummary(profileId, schemeCode)` -> `GET /api/v1/profiles/{profile_id}/finance/summary?scheme_code={scheme_code}` (Calculated EMI and subsidy)

---

### Business & Location Intelligence + Feasibility `[STEP 9]`

#### `POST /api/v1/feasibility/analyze` (or `POST /feasibility/analyze`)
Performs deterministic multi-dimensional feasibility evaluation on a structured entrepreneur context or profile ID. Returns signals across 6 dimensions (`LOCATION_SIGNAL`, `SECTOR_SIGNAL`, `BUSINESS_STAGE_SIGNAL`, `FINANCIAL_FEASIBILITY_SIGNAL`, `DATA_COMPLETENESS_SIGNAL`, `RISK_SIGNAL`), overall status (`FAVOURABLE`, `CAUTION`, `HIGH_RISK`, `INSUFFICIENT_DATA`), positive drivers, risk flags, missing fields, and actionable recommendations.

**Request Payload**:
```json
{
  "context": {
    "sector": "manufacturing",
    "business_stage": "new_enterprise",
    "district": "Pune",
    "state": "Maharashtra",
    "project_cost": 1500000,
    "own_contribution": 250000,
    "monthly_income": 45000,
    "is_defaulter": false
  }
}
```

**Response Example (200 OK)**:
```json
{
  "overall_status": "FAVOURABLE",
  "headline": "Viable MSME Ecosystem Match in Pune, Maharashtra",
  "summary_notes": "Proposed manufacturing enterprise demonstrates healthy promoter equity (16.7%) and aligns with active industrial clusters in Pune district.",
  "evaluated_at": "2026-09-07T17:00:00Z",
  "profile_summary": {
    "sector": "manufacturing",
    "business_stage": "new_enterprise",
    "location": "Pune, Maharashtra",
    "project_cost": 1500000.0,
    "own_contribution": 250000.0,
    "loan_requirement": 1250000.0
  },
  "signals": [
    {
      "signal_type": "LOCATION_SIGNAL",
      "signal_code": "LOC_DIST_ECOSYSTEM",
      "title": "Established District MSME Ecosystem",
      "status": "VERIFIED",
      "is_positive": true,
      "interpretation": "Located in Tier-1 industrial district Pune with 18+ registered industrial estates.",
      "explanation": "High industrial density score (88/100) and established DIC support office.",
      "source_name": "Ministry of MSME - District Industrial Profile",
      "source_url": "https://dcmsme.gov.in"
    }
  ],
  "positive_signals": [
    "Located in high-density MSME industrial corridor (Pune, Maharashtra).",
    "Promoter equity contribution (16.7%) satisfies standard scheme margin requirement (10-25%)."
  ],
  "risk_signals": [],
  "missing_information": [],
  "recommendations": [
    "Verify project site feasibility and power connectivity via District Industries Centre (DIC) Pune.",
    "Explore subsidy linkage under PMEGP or MUDRA schemes."
  ],
  "disclaimer": "Feasibility analysis is an explainable decision-support indicator and does not guarantee business success, profitability, demand, loan approval, or scheme approval."
}
```

#### `GET /api/v1/profiles/{profile_id}/feasibility`
Executes feasibility evaluation for a stored entrepreneur profile record.

#### `GET /api/v1/locations/intelligence?district=Pune&state=Maharashtra`
Fetches verified district MSME ecosystem profile (tier, thrust sectors, industrial density score, DIC office contacts).

#### `GET /api/v1/locations/nearby-clusters?district=Pune&state=Maharashtra&sector=manufacturing`
Fetches nearest registered MSME industrial and artisan clusters with distance in kilometers.

---

### Channel Partners & Application Tracking `[STEP 10]`

#### `GET /api/v1/partners`
Retrieves a filtered list of channel partners (banks, DICs, KVIC offices, CSCs) by district, state, partner type, or verification status.

**Query Parameters**:
- `district` (string, optional)
- `state` (string, optional)
- `partner_type` (string, optional: `GOVERNMENT_AGENCY`, `PUBLIC_SECTOR_BANK`, `PRIVATE_BANK`, `REGIONAL_RURAL_BANK`, `CSC_CENTER`, `NBFC_MFI`)
- `verification_status` (string, optional: `VERIFIED`, `PROVISIONAL`, `UNVERIFIED`)
- `limit` (integer, default: 20)
- `offset` (integer, default: 0)

#### `GET /api/v1/partners/nearby`
Finds channel partners within a geographic radius (km) using PostGIS spatial calculations.

**Query Parameters**:
- `latitude` (float, required)
- `longitude` (float, required)
- `radius_km` (float, default: 25.0)
- `partner_type` (string, optional)
- `limit` (integer, default: 20)

#### `GET /api/v1/partners/{partner_id}`
Retrieves detailed information for a specific channel partner, including contact details, nodal officers, supported services, and affiliated schemes.

#### `GET /api/v1/schemes/{scheme_id_or_code}/partners`
Retrieves verified implementing agencies and lending banks affiliated with a specific scheme, prioritized by the entrepreneur's district.

**Query Parameters**:
- `district` (string, optional)
- `state` (string, optional)
- `limit` (integer, default: 20)

#### `GET /api/v1/applications/assistance`
Synthesizes a personalized application assistance package combining Step 3 documents checklist, Step 4 eligibility evaluation, Step 5 financial structuring, and Step 10 verified channel partners.

**Query Parameters**:
- `profile_id` (UUID, required)
- `scheme_code` (string, required)

#### `POST /api/v1/applications`
Creates a new tracked scheme loan application for an entrepreneur.

**Request Payload (`ApplicationCreate`)**:
```json
{
  "profile_id": "4261da24-814e-4f01-9f93-e40742f15033",
  "scheme_id": "c1f7ca40-a15d-4f16-928d-c7bc41a99577",
  "channel_partner_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "loan_amount_requested": 1250000.0,
  "project_cost": 1500000.0,
  "own_contribution": 250000.0,
  "target_bank_name": "State Bank of India",
  "target_branch": "Pune SME City Credit Center",
  "application_notes": "Applied for spice manufacturing unit machinery expansion."
}
```

#### `GET /api/v1/applications`
Lists tracked applications, optionally filtered by `profile_id` or `status`.

#### `GET /api/v1/applications/{application_id}`
Retrieves complete application details, current status, verified scheme and partner information, and full chronological status timeline.

#### `POST /api/v1/applications/{application_id}/status`
Appends a status transition event to the application timeline with immutable audit recording.

**Request Payload (`ApplicationStatusUpdate`)**:
```json
{
  "status": "APPLICATION_SUBMITTED",
  "sub_status": "ONLINE_PORTAL_SUBMITTED",
  "remarks": "Uploaded project report and Aadhaar Udyam certificate on PMEGP e-portal.",
  "portal_acknowledgement_no": "PMEGP/2026/MH/PN/882194",
  "source_type": "USER_RECORDED",
  "action_required": "Visit DIC Pune with physical documents for verification.",
  "next_step": "Physical verification by DIC Task Force Committee."
}
```

---

### Grounded AI & RAG Intelligence `[STEP 11]`

#### `GET /api/v1/ai/health`
Returns operational and configuration status of the Grounded AI layer, active Gemini model (`gemini-2.5-flash`), live key status, and supported capabilities.

#### `POST /api/v1/ai/chat`
Submits a conversational question to VittMitra AI. Synthesizes relevant profile context, deterministic engine results, and hybrid RAG chunks into a grounded response with verified citations and confidence rating.

**Request Payload (`GroundedChatRequest`)**:
```json
{
  "message": "What is the PMEGP subsidy percentage for rural women entrepreneurs?",
  "profile_id": "4261da24-814e-4f01-9f93-e40742f15033",
  "scheme_code": "PMEGP",
  "topic": "finance",
  "language": "en"
}
```

**Response Payload (`GroundedChatResponse`)**:
```json
{
  "answer": "Under the Prime Minister's Employment Generation Programme (PMEGP), women entrepreneurs setting up manufacturing or service enterprises in rural areas receive a 35% margin money government subsidy, requiring only a 5% promoter equity contribution.",
  "grounded": true,
  "confidence": "HIGH",
  "sources": [
    {
      "source_name": "KVIC Official Portal",
      "source_type": "OFFICIAL_PORTAL",
      "official_url": "https://www.kviconline.gov.in/pmegpeportal",
      "section_type": "financial_benefits"
    }
  ],
  "limitations": [
    "Maximum subsidy is capped at Rs. 50 Lakhs for manufacturing projects"
  ],
  "suggested_actions": [
    "Use the VittMitra Financial Calculator to simulate loan amortization",
    "Assemble your Aadhaar, PAN, and rural residence proof"
  ],
  "disclaimer": "VittMitra AI is an explainable decision-support assistant grounded in official government scheme guidelines. Deterministic engines remain authoritative for eligibility, financial calculations, and application status.",
  "evaluated_at": "2026-09-07T17:48:00Z"
}
```

#### `POST /api/v1/ai/explain/eligibility`
Generates a plain-language grounded explanation of Step 4 Eligibility Engine results.

#### `POST /api/v1/ai/explain/finance`
Generates a plain-language grounded explanation of Step 5 Financial Engine loan structuring and amortization calculations.

#### `POST /api/v1/ai/explain/feasibility`
Generates a plain-language grounded explanation of Step 9 Feasibility signals and MSME cluster density.

#### `POST /api/v1/ai/explain/scheme`
Generates a plain-language grounded overview of scheme guidelines, benefits, and required documents.

---

## 3. Planned Endpoints (Future Milestones)

| Domain | Method | Endpoint | Milestone |
| :--- | :--- | :--- | :--- |
| **Post-Loan Copilot** | `POST` | `/api/v1/copilot/monitor` | Step 12 (Post-Loan Business Copilot) |



