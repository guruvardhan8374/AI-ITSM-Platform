# API Specification & Endpoint Guidelines

## Base URL
`/api/v1`

## Health Check
- `GET /api/v1/health`: Returns system health, service version, and database connection status.

## Planned Endpoints (Phase 2)
- `POST /api/v1/auth/login`: Authenticate user and return JWT access token.
- `GET /api/v1/incidents`: List all incidents with filtering and pagination.
- `POST /api/v1/incidents`: Create a new incident.
- `POST /api/v1/ai/analyze`: Trigger AI Incident Analysis & Root Cause prediction.
- `POST /api/v1/ai/assist`: Get AI-assisted resolution steps & script suggestions.
