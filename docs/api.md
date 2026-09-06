# VittMitra API Specifications & Contracts

## 1. Conventions & Standards

- **Base URL Prefix**: `/api/v1` (with convenience root shortcuts for health and scheme exploration)
- **Data Format**: `application/json`
- **Authentication**: Public read-only endpoints (Auth introduced in future milestone)
- **Status Codes**:
  - `200 OK`: Request succeeded
  - `404 Not Found`: Scheme or resource does not exist
  - `503 Service Unavailable`: Dependent service (e.g. database) unreachable

---

## 2. Implemented Endpoints (Milestones 1, 2, & 3)

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

**Response Example**:
```json
[
  {
    "id": 1,
    "scheme_code": "PMEGP",
    "scheme_name": "Prime Minister's Employment Generation Programme",
    "short_description": "Credit-linked subsidy programme aimed at generating self-employment opportunities...",
    "nodal_ministry": "Ministry of Micro, Small and Medium Enterprises",
    "geography_level": "NATIONAL",
    "target_beneficiaries": ["General", "SC", "ST", "OBC", "Women", "Minorities"],
    "sectors": ["manufacturing", "services", "agro_allied", "handicrafts"],
    "data_status": "VERIFIED",
    "is_active": true,
    "last_verified_at": "2026-09-06T12:00:00Z"
  }
]
```

---

#### `GET /api/v1/schemes/{scheme_identifier}` (or `GET /schemes/{scheme_identifier}`)
Retrieve comprehensive scheme specifications by database ID or unique scheme code (`PMEGP`, `STANDUP_INDIA`, `MUDRA_PMMY`, `PM_SVANIDHI`, `PM_VISHWAKARMA`).

**Response Example**:
```json
{
  "id": 1,
  "scheme_code": "PMEGP",
  "scheme_name": "Prime Minister's Employment Generation Programme",
  "short_description": "Credit-linked subsidy programme aimed at generating self-employment opportunities...",
  "nodal_ministry": "Ministry of Micro, Small and Medium Enterprises",
  "nodal_department": "Khadi and Village Industries Commission (KVIC)",
  "geography_level": "NATIONAL",
  "target_beneficiaries": ["General", "SC", "ST", "OBC", "Women"],
  "purpose": "To generate continuous and sustainable employment opportunities in rural and urban areas...",
  "benefits_summary": {
    "max_project_cost_manufacturing_inr": 5000000,
    "max_project_cost_services_inr": 2000000,
    "subsidy_rate_urban_general_pct": 15.0,
    "subsidy_rate_rural_general_pct": 25.0,
    "subsidy_rate_urban_special_pct": 25.0,
    "subsidy_rate_rural_special_pct": 35.0,
    "own_contribution_general_pct": 10.0,
    "own_contribution_special_pct": 5.0
  },
  "business_stages": ["new_enterprise"],
  "sectors": ["manufacturing", "services", "agro_allied", "handicrafts"],
  "data_status": "VERIFIED",
  "is_active": true,
  "created_at": "2026-09-06T18:40:00Z",
  "updated_at": "2026-09-06T18:40:00Z",
  "sources": [
    {
      "id": 1,
      "source_name": "Ministry of MSME - PMEGP Scheme Guidelines",
      "source_type": "OFFICIAL_GUIDELINE",
      "official_url": "https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp",
      "document_reference": "PMEGP Scheme Guidelines 2022-26, MSME Ministry",
      "publication_date": "2022-05-30",
      "last_verified_at": "2026-09-06T12:00:00Z",
      "version": "2022.1",
      "notes": "Revised subsidy ceilings up to 50 Lakhs for manufacturing.",
      "is_active": true
    }
  ],
  "eligibility_rules": [
    {
      "id": 1,
      "rule_code": "PMEGP_MIN_AGE",
      "field_name": "age",
      "operator": ">=",
      "expected_value": 18,
      "description": "Applicant must be at least 18 years of age at the time of application.",
      "source_id": 1,
      "rule_version": "1.0",
      "is_active": true
    }
  ],
  "documents": [
    {
      "id": 1,
      "document_code": "AADHAAR_CARD",
      "document_name": "Aadhaar Card",
      "description": "Primary identity and address verification",
      "is_mandatory": true,
      "source_id": 1
    }
  ]
}
```

---

## 3. Planned Endpoints (Future Milestones)

| Domain | Method | Endpoint | Milestone |
| :--- | :--- | :--- | :--- |
| **Eligibility** | `POST` | `/api/v1/eligibility/evaluate` | Step 4 (Deterministic Eligibility Engine) |
| **Finance** | `POST` | `/api/v1/finance/calculate-dpr` | Step 5 (Deterministic Financial Engine) |
| **AI / RAG** | `POST` | `/api/v1/ai/explain-scheme` | Step 6 (Grounded AI Explanations) |
| **Applications**| `POST` | `/api/v1/applications` | Step 7 (Application Tracking) |
