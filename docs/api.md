# VittMitra API Specifications & Contracts

## 1. Conventions & Standards

- **Base URL Prefix**: `/api/v1`
- **Data Format**: `application/json`
- **Authentication**: Bearer JWT (planned in future auth milestone)
- **Status Codes**: Standard HTTP semantic status codes (200, 201, 400, 401, 403, 404, 422, 500)
- **Error Response Format**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed human-readable explanation",
    "details": []
  }
}
```

---

## 2. Implemented Endpoints (Milestone 1)

### Health Checks
- `GET /health` — Root health check endpoint for container probes and load balancers.
- `GET /api/v1/health` — API v1 status and service heartbeat.

**Response**:
```json
{
  "status": "healthy",
  "app_name": "VittMitra API",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## 3. Planned API Endpoints (Future Milestones)

| Domain | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | Register new user/entrepreneur |
| **Auth** | `POST` | `/api/v1/auth/login` | Login and acquire token |
| **Profile** | `GET` | `/api/v1/profile` | Retrieve entrepreneur profile |
| **Profile** | `PUT` | `/api/v1/profile` | Update profile attributes & demographics |
| **Business** | `POST` | `/api/v1/business/analyze` | Evaluate business idea & local feasibility |
| **Finance** | `POST` | `/api/v1/finance/calculate` | Compute project cost, subsidy, margin money & EMI |
| **Schemes** | `POST` | `/api/v1/schemes/match` | Evaluate deterministic scheme eligibility |
| **Schemes** | `GET` | `/api/v1/schemes/{id}` | Get detailed scheme specs & requirements |
| **Schemes** | `POST` | `/api/v1/schemes/compare` | Compare multiple schemes side-by-side |
| **AI / RAG** | `POST` | `/api/v1/ai/explain-eligibility` | Synthesize grounded plain-language eligibility rationale |
| **AI / Copilot**| `POST` | `/api/v1/ai/copilot/chat` | Multilingual conversational advisor |
| **Applications**| `POST` | `/api/v1/applications` | Create scheme application draft |
| **Applications**| `GET` | `/api/v1/applications/{id}/track` | Retrieve real-time application timeline status |
