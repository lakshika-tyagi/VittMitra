# VittMitra Backend Service (FastAPI)

Core REST API service and domain calculation engines for VittMitra.

## Directory Layout
```text
backend/
├── app/
│   ├── api/          # API route definitions and endpoint handlers (v1)
│   ├── core/         # Application settings, database engine, security config
│   ├── models/       # SQLAlchemy / SQLModel database entities
│   ├── schemas/      # Pydantic schemas (Request and Response contracts)
│   ├── services/     # Business logic, financial calculations, rule engines
│   └── main.py       # FastAPI application factory and router registration
├── tests/            # Pytest test suite
├── Dockerfile        # Container build definition
├── requirements.txt  # Python package dependencies
└── README.md
```

## Running Locally

1. Create and activate a Python virtual environment:
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4. Verify health endpoint:
```bash
curl http://localhost:8000/health
```

5. Run test suite:
```bash
pytest
```
Interactive Swagger API documentation is available at `http://localhost:8000/docs`.
