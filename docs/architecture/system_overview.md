# System Architecture Overview - AI-Powered ITSM Platform

## 1. System Context & Overview
The **AI-Powered IT Service Management and Incident Resolution Platform** is an enterprise-grade IT Operations system designed to streamline IT incident management, automated root-cause diagnosis, service requests, change management, asset management, and SLA compliance.

## 2. Multi-Tier Architecture

```
                                  ┌─────────────────────────────┐
                                  │      React + Vite Frontend  │
                                  │   (TypeScript / Tailwind)   │
                                  └──────────────┬──────────────┘
                                                 │ REST API / JSON
                                  ┌──────────────▼──────────────┐
                                  │       FastAPI Backend       │
                                  │    (Pydantic / SQLAlchemy)  │
                                  └──────┬───────────────┬──────┘
                                         │               │
                         ┌───────────────▼┐             ┌▼────────────────┐
                         │ PostgreSQL DB  │             │  AI Engine      │
                         │ (Relational)   │             │ (Mock / LLM API)│
                         └────────────────┘             └─────────────────┘
```

### Component Roles
- **Frontend Layer**: Built using React 18, Vite, TypeScript, Tailwind CSS, Lucide React, and Recharts. Implements a responsive dark dashboard UI with sidebar navigation.
- **Backend API Layer**: Built using FastAPI with async SQLAlchemy 2.0 ORM and Pydantic v2 schemas. Exposes modular RESTful endpoints.
- **AI Engine Layer**: Isolated Python AI service providing incident prioritization, root cause analysis, and resolution suggestions. Switchable from mock mode to real LLM providers (OpenAI/Gemini/Claude).
- **Database Layer**: PostgreSQL 15 running via Docker Compose.
