# Backend - AI-Powered ITSM Platform API

High-performance asynchronous backend service built with **FastAPI**, **Pydantic v2**, **SQLAlchemy 2.0 (Async)**, and **PostgreSQL**.

## Architecture & Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/     # REST API route handlers
│   │       └── router.py      # Main API router registry
│   ├── core/                  # App configuration & JWT security
│   ├── models/                # SQLAlchemy database domain models (22 entities)
│   ├── schemas/               # Pydantic data validation schemas
│   ├── services/              # Business logic & domain services
│   ├── repositories/          # Database access repositories
│   ├── database/              # Async engine & session setup
│   ├── middleware/            # Custom FastAPI middleware (CORS, Auth)
│   └── main.py                # App entry point
├── requirements.txt
└── README.md
```

## Running Locally

```bash
# 1. Create Python Virtual Environment
python -m venv venv

# 2. Activate Virtual Environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# 3. Install Dependencies
pip install -r requirements.txt

# 4. Start Uvicorn Server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger UI interactive docs will be available at `http://localhost:8000/docs`.
