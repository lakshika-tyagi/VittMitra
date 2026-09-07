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

## 3. Planned Endpoints (Future Milestones)

| Domain | Method | Endpoint | Milestone |
| :--- | :--- | :--- | :--- |
| **Finance** | `POST` | `/api/v1/finance/calculate-dpr` | Step 5 (Deterministic Financial Engine) |
| **Matching** | `POST` | `/api/v1/schemes/match` | Step 6 (Multi-Scheme Matching & Ranking) |
| **AI / RAG** | `POST` | `/api/v1/ai/explain-scheme` | Step 7 (Grounded AI Explanations) |
| **Applications**| `POST` | `/api/v1/applications` | Step 9 (Application Tracking) |
