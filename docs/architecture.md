# VittMitra Architecture Specification

## 1. System Overview

VittMitra is designed with an API-first, decoupled architecture separating the Presentation Layer (Next.js), Core Business & API Layer (FastAPI), Persistence Layer (PostgreSQL with PostGIS), Scheme Knowledge Layer, and Intelligence Layer (Deterministic Rule Engines + Grounded Gemini RAG Services).

```mermaid
flowchart TD
    subgraph Client["Presentation Layer (Next.js Client)"]
        UI["Next.js App Router (TypeScript)"]
        VoiceUI["Multilingual & Voice Module"]
    end

    subgraph API["Backend API Layer (FastAPI)"]
        Gateway["FastAPI App Gateway"]
        AuthSvc["Auth & Profile Management"]
        GeoSvc["Geospatial & Location Service"]
        BizSvc["Business Feasibility Engine"]
        FinSvc["Financial Structuring Engine"]
        SchemeKnowledgeAPI["Scheme Discovery & Retrieval API"]
        RuleEngine["Deterministic Scheme Eligibility Engine"]
        AppSvc["Application Assistance & Tracker"]
    end

    subgraph SchemeKnowledge["Authoritative Scheme Knowledge Layer"]
        SchemeStore[("Verified Schemes Repository")]
        SourceStore[("Source & Gazette Metadata")]
        RuleStore[("Deterministic Rule Specs")]
        DocStore[("Required Document Specs")]
    end

    subgraph Database["Persistence Layer (PostgreSQL + PostGIS)"]
        DBSession["SQLAlchemy 2.0 (Async Engine & Pool)"]
        AlembicMgr["Alembic Migration Manager"]
        PostgresDB[("PostgreSQL 15+ Core Tables")]
        PostGISSpatial[("PostGIS 3.3+ Spatial Engine")]
    end

    subgraph Intelligence["AI & Intelligence Layer"]
        GeminiLLM["Google Gemini API (Natural Explanations)"]
        VectorDB["RAG Knowledge Store (Scheme Guidelines)"]
        Bhashini["Bhashini Multilingual Service"]
    end

    UI -->|REST / JSON| Gateway
    VoiceUI -->|Voice / Audio Stream| Gateway
    Gateway --> SchemeKnowledgeAPI
    Gateway --> AuthSvc
    Gateway --> GeoSvc
    Gateway --> BizSvc
    Gateway --> FinSvc
    Gateway --> RuleEngine
    Gateway --> AppSvc

    SchemeKnowledgeAPI --> SchemeStore
    SchemeKnowledgeAPI --> SourceStore
    SchemeKnowledgeAPI --> RuleStore
    SchemeKnowledgeAPI --> DocStore

    SchemeStore --> DBSession
    SourceStore --> DBSession
    RuleStore --> DBSession
    DocStore --> DBSession

    DBSession --> PostgresDB
    DBSession --> PostGISSpatial
    AlembicMgr --> PostgresDB

    RuleEngine -->|Evaluates against| RuleStore
    VectorDB -->|Indexes verified text from| SourceStore
    RuleEngine -->|Deterministic Results| GeminiLLM
    VectorDB -->|Retrieved Context| GeminiLLM
    GeminiLLM -->|Explainable Recommendations| Gateway
    Bhashini -->|Language Translation & Speech| Gateway
```

---

## 2. Deterministic Eligibility Engine Architecture `[STEP 4]`

### A. Authoritative Grounding & Non-Black-Box Principle
VittMitra's Eligibility Engine evaluates an entrepreneur's structured profile inputs against official scheme rules stored in PostgreSQL.

**Crucially, LLMs / Gemini / AI models do NOT participate in eligibility decisions.**

```
Entrepreneur Profile Input (JSON)
              ↓
Safe Field Resolver & Type Normalizer
              ↓
Active Scheme Rules from Database (is_active=True)
              ↓
Deterministic Operator Evaluation (>=, <=, ==, !=, IN, NOT_IN, CONTAINS, BOOLEAN)
              ↓
Three-State Outcome: MATCHED / FAILED / UNVERIFIED
              ↓
Rule-Specific Deterministic Explainer
              ↓
Source & Gazette Guideline Linkage
              ↓
Scheme-Level Aggregation (Mandatory vs. Optional Criteria)
              ↓
Structured API Response: POST /api/v1/eligibility/check
```

### B. The Three Core Eligibility States
1. **`MATCHED`**: Available applicant information satisfies the condition.
2. **`FAILED`**: Available applicant information clearly violates the condition.
3. **`UNVERIFIED`**: Information is missing, empty, invalidly typed, or operator cannot be safely evaluated.
   - `UNVERIFIED` is NEVER treated as `FAILED`.
   - `UNVERIFIED` is NEVER treated as `MATCHED`.
   - Missing fields are never guessed or defaulted to 0/False.

### C. Supported Rule Operators
- **Numeric**: `>=`, `>`, `<=`, `<` (with safe numeric string normalization)
- **Equality**: `==`, `!=` (supporting numbers, booleans, and case-insensitive strings)
- **Membership**: `IN`, `NOT_IN` (scalar in list or list intersection)
- **Containment**: `CONTAINS`, `NOT_CONTAINS`
- **Boolean**: `BOOLEAN`, `BOOL`
- **Fallback**: Any unrecognized operator or unconvertible type returns `UNVERIFIED`.

### D. Safe Field Resolution & Aliases
The engine resolves fields safely through a canonical alias dictionary without dynamic code evaluation:
- `age` / `applicant_age`
- `category` / `social_category` / `caste`
- `annual_income` / `income`
- `project_cost` / `investment` / `loan_amount`
- `business_stage` / `business_type`
- Compound fields like `category_or_gender` (e.g., Stand-Up India criteria)

### E. Scheme-Level Aggregation Logic
1. If **one or more mandatory rules** evaluate to `FAILED`: Overall Scheme Status = `FAILED`.
2. If **no mandatory rules** evaluate to `FAILED` but **one or more mandatory rules** are `UNVERIFIED`: Overall Scheme Status = `UNVERIFIED`.
3. If **all mandatory rules** evaluate to `MATCHED`: Overall Scheme Status = `MATCHED`.
4. Non-mandatory (advisory/optional) criteria results are preserved at the criterion level but do not fail the overall status if all mandatory criteria are satisfied.

### F. Source Traceability
Every criterion result is linked to its authoritative guideline record (`source_id`, `source_name`, `source_url`, `rule_version`).

---

## 3. Deterministic Financial Engine Architecture `[STEP 5]`

### A. Non-Black-Box Financial Modeling Principle
The Financial Engine helps entrepreneurs model the loan structure, required margin money, financing gap, reducing-balance EMI amortization, total repayment liabilities, and affordability indicators (DTI) using transparent mathematical formulations.

**Zero LLM / Generative AI Involvement**: No AI model or statistical approximation generates financial figures. All calculations utilize Python's `Decimal` standard library with `ROUND_HALF_UP` to prevent floating-point inaccuracies.

```
Entrepreneur Financial Inputs (JSON)
        ↓
Input Validation & Boundary Checking (Negative amounts, Tenure > 0, Income >= 0)
        ↓
Project Cost & Financing Gap Calculator (Machinery + Working Capital + Other - Own Contribution)
        ↓
Reducing-Balance EMI Amortization (P * r * (1+r)^n / ((1+r)^n - 1))
        ↓
Full Repayment Summary (Total Repayment, Total Interest, Financing %, Own %)
        ↓
Affordability & Debt-to-Income Stress Analyzer (DTI Ratio & Risk Categorization)
        ↓
Scenario Evaluation Engine (Base vs. Conservative vs. Optimistic vs. Custom Scenarios)
        ↓
Structured API Responses: POST /api/v1/finance/calculate & POST /api/v1/finance/scenarios
```

### B. Core Mathematical Formulations

1. **Project Cost Breakdown & Validation**:
   - $\text{Total Cost} = \text{Machinery Cost} + \text{Working Capital} + \text{Other Costs}$
   - If total cost is directly supplied, the sum of breakdown items must match or be smaller than total cost.
   - $\text{Financing Gap} = \max(0, \text{Project Cost} - \text{Own Contribution})$
   - $\text{Financing Percentage} = \frac{\text{Financing Gap}}{\text{Project Cost}} \times 100$
   - $\text{Own Contribution Percentage} = \frac{\text{Own Contribution}}{\text{Project Cost}} \times 100$

2. **Reducing-Balance Monthly EMI**:
   - Formula: $\text{EMI} = \frac{P \times r \times (1+r)^n}{(1+r)^n - 1}$
   - Where:
     - $P$ = Principal Loan Amount / Financing Gap ($\ge 0$)
     - $r$ = Monthly interest rate $= \frac{\text{annual\_interest\_rate}}{12 \times 100}$
     - $n$ = Loan tenure in months ($n > 0$)
   - For $0\%$ Interest / Subsidized Loans: $\text{EMI} = \frac{P}{n}$

3. **Repayment Summary**:
   - $\text{Total Repayment} = \text{EMI} \times n$
   - $\text{Total Interest} = \max(0, \text{Total Repayment} - P)$

4. **Debt-to-Income (DTI) & Affordability Stress**:
   - If Monthly Income $> 0$:
     - $\text{DTI} = \frac{\text{EMI} + \text{Existing Monthly Obligations}}{\text{Monthly Income}} \times 100$
     - Risk Classification:
       - $\text{DTI} \le 30\% \rightarrow \mathbf{LOW\_RISK}$ (Healthy repayment capacity)
       - $30\% < \text{DTI} \le 50\% \rightarrow \mathbf{MODERATE\_RISK}$ (Manageable debt load)
       - $\text{DTI} > 50\% \rightarrow \mathbf{HIGH\_RISK}$ (High repayment stress / high default risk)
   - If Monthly Income is missing or $0$: Category $= \mathbf{UNSPECIFIED}$, explanation clarifies missing baseline.

5. **Scenario Comparison Engine**:
   - Evaluates interest rate variations (Base, Conservative $+1.5\%$, Optimistic $-1.5\%$) and tenure shifts.
   - Computes delta metrics against base scenario for transparent decision-making.

---

## 4. Scheme Knowledge & Anti-Hallucination Framework `[STEP 3]`

1. **Zero Hallucination Tolerance**: Scheme parameters (subsidy percentages, project cost limits, interest rates, age thresholds) are NEVER invented or approximated by LLMs.
2. **Every Record Source-Linked**: Each scheme record contains foreign-key relationships to `scheme_sources` containing official URLs (`kviconline.gov.in`, `standupmitra.in`, `mudra.org.in`, etc.), ministry guideline publication dates, and verification timestamps (`last_verified_at`).
3. **Explicit Data Status**: The system strictly categorizes data confidence into:
   - `VERIFIED`: Directly verified from official government gazettes, ministry circulars, or central portals.
   - `ESTIMATED`: Used only for non-legal projections (never for legal scheme eligibility).
   - `UNVERIFIED`: Explicitly flagged if authoritative source data is unavailable or undergoing revision.

---

## 4. Database & Spatial Architecture (PostgreSQL + PostGIS)

- **Database Engine**: PostgreSQL 15+ with PostGIS 3.3+ spatial extension.
- **ORM & Dialect**: SQLAlchemy 2.0 (Asyncio) with `asyncpg` driver.
- **Connection Pooling**: Pre-ping enabled async connection pool (`pool_size=10`, `max_overflow=20`, `timeout=5s`).
- **Migration Framework**: Alembic 1.13+ configured with async execution and PostGIS table isolation filters.

---

## 5. Security & Data Protection

- **Public Scheme Knowledge**: Government scheme data is public and free of PII.
- **Client Rule Isolation**: Clients cannot manipulate authoritative rule definitions in API requests; rules are strictly queried from the trusted database.
- **Environment Isolation**: Connection secrets managed strictly through `.env` with zero committed credentials.
- **Sanitized API Responses**: Clear separation between public API responses and internal database columns.
