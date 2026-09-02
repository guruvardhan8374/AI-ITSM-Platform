# AI-Powered IT Service Management & Incident Resolution Platform

An enterprise-grade, academic final-year IT Operations platform featuring AI-driven incident analysis, root cause prediction, automated resolution recommendations, infrastructure monitoring, SLA compliance, and Role-Based Access Control (RBAC).

---

## 🚀 Technology Stack

### **Frontend**
- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Dark Enterprise Dashboard Theme)
- **Icons & Visuals:** Lucide React
- **Analytics & Charts:** Recharts
- **Routing:** React Router v6

### **Backend**
- **Framework:** Python FastAPI
- **Data Validation:** Pydantic v2
- **ORM:** SQLAlchemy 2.0 (Async)
- **Database Driver:** AsyncPG / Psycopg2
- **Authentication:** JWT (JSON Web Tokens) with Passlib & PyJWT

### **Database & Infrastructure**
- **Database:** PostgreSQL 15 (Dockerized via `docker-compose.yml`)
- **Database Administration:** pgAdmin 4

### **AI Engine**
- **Architecture:** Isolated Python AI Engine Module (`ai-engine/`)
- **Mode:** Mock AI Provider with clean interfaces ready for OpenAI, Anthropic Claude, or Google Gemini integration.

---

## 📁 Repository Structure

```
AI-ITSM-Platform/
├── frontend/                 # React + Vite + TypeScript Frontend App
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Module pages (Dashboard, Incidents, Assets, AI Tools)
│   │   ├── layouts/          # Dark Theme Sidebar, Header, MainLayout
│   │   ├── routes/           # AppRouter navigation configuration
│   │   ├── services/         # Axios API client & health check service
│   │   ├── hooks/            # Custom React hooks
│   │   ├── context/          # Auth Context & Global State
│   │   ├── types/            # TypeScript interface definitions
│   │   ├── utils/            # Helper utilities & constants
│   │   └── App.tsx           # Main application entry
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── README.md
│
├── backend/                  # FastAPI Asynchronous Backend API
│   ├── app/
│   │   ├── api/              # API v1 routes and health endpoints
│   │   ├── core/             # Configuration & security settings
│   │   ├── models/           # SQLAlchemy domain models (22 database tables)
│   │   ├── schemas/          # Pydantic validation models
│   │   ├── services/         # Business domain logic
│   │   ├── repositories/     # Database access layer
│   │   ├── database/         # Async engine & session setup
│   │   ├── middleware/       # CORS & Auth middleware
│   │   └── main.py           # FastAPI application entry point
│   ├── requirements.txt
│   └── README.md
│
├── ai-engine/                # AI Incident Analysis & Resolution Module
│   ├── services/             # Incident Analyzer & Resolution Assistant
│   ├── models/               # AI data models
│   ├── prompts/              # LLM prompt templates
│   ├── mock/                 # Mock response generator for offline dev
│   └── README.md
│
├── database/                 # Database Migrations & Seed Scripts
│   ├── migrations/           # Alembic migration revisions
│   ├── seed/                 # Initial data seed scripts
│   └── README.md
│
├── docs/                     # System Documentation
│   ├── architecture/         # Multi-tier system design & diagrams
│   ├── api/                  # REST API specification
│   ├── database/             # Entity Relationship & Schema design
│   └── project/              # Requirements & Viva defense guide
│
├── screenshots/              # UI Mockups & System screenshots
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore configuration
├── docker-compose.yml        # PostgreSQL & pgAdmin container setup
└── README.md                 # Root documentation
```

---

## 🛠️ Quick Start & Execution Guide

### 1. Database Setup (PostgreSQL via Docker)
Start the PostgreSQL database and pgAdmin containers:
```bash
docker-compose up -d
```
- **PostgreSQL Host:** `localhost:5432` (User: `itsm_admin`, Password: `itsm_password_123`, DB: `itsm_db`)
- **pgAdmin UI:** `http://localhost:5050` (Email: `admin@itsm.local`, Password: `admin_password_123`)

---

### 2. Backend Setup (FastAPI)
Navigate to the `backend/` directory:
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Start FastAPI dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- **API Health Endpoint:** `http://localhost:8000/api/v1/health`
- **Swagger Interactive API Docs:** `http://localhost:8000/docs`

---

### 3. Frontend Setup (React + Vite)
Navigate to the `frontend/` directory:
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
- **Frontend Dashboard App:** `http://localhost:5173`

---

## 🔐 Role-Based Access Control (RBAC)
The system is built to enforce fine-grained permissions for **7 distinct user roles**:
1. **Super Admin**: Complete administrative control over users, business units, system config, and audit logs.
2. **IT Manager**: Governance, SLA tracking, executive reports, and team resource allocation.
3. **Service Desk Agent**: Ticket triage, service request fulfillment, and initial incident categorization.
4. **IT Support Engineer**: Incident resolution, problem root-cause investigation, and KB contributions.
5. **Infrastructure Engineer**: Asset management, server/metric monitoring, and alert resolution.
6. **Change Manager**: Change Advisory Board (CAB) reviews, risk assessment, and approval workflows.
7. **End User**: Self-service portal, incident reporting, and request tracking.

---

## 🗄️ Database Entities (22 Tables)
The SQLAlchemy database schema includes:
`User`, `Role`, `Permission`, `Department`, `BusinessUnit`, `Team`, `Incident`, `IncidentComment`, `IncidentHistory`, `ServiceRequest`, `ServiceCatalog`, `Problem`, `Change`, `ChangeApproval`, `Asset`, `AssetHistory`, `InfrastructureResource`, `InfrastructureMetric`, `Alert`, `KnowledgeArticle`, `SLAPolicy`, `Notification`, `AuditLog`.

---

## 🎓 Viva / Academic Defense Summary
During project presentation or viva examination, highlight:
1. **Separation of Concerns**: Complete decoupling of UI (React), API (FastAPI), Database (SQLAlchemy/PostgreSQL), and AI Service.
2. **AI Provider Abstraction**: The AI Engine uses standard Python service interfaces (`IncidentAnalyzerService`), making it plug-and-play to swap mock responses for real LLM APIs without touching business logic.
3. **Type Safety & Validation**: Strict TypeScript on frontend and Pydantic v2 schemas on backend.
