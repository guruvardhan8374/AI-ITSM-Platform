# Database Configuration & Schema - ITSM Platform

PostgreSQL relational database schema management, Alembic migrations, and seed scripts.

## Database Entities

- `User`, `Role`, `Permission`, `Department`, `BusinessUnit`, `Team`
- `Incident`, `IncidentComment`, `IncidentHistory`
- `ServiceCatalog`, `ServiceRequest`
- `Problem`, `Change`, `ChangeApproval`
- `Asset`, `AssetHistory`
- `InfrastructureResource`, `InfrastructureMetric`, `Alert`
- `KnowledgeArticle`, `SLAPolicy`, `Notification`, `AuditLog`

## Running Migrations & Seeding

```bash
# Seed initial roles and system data
python -m database.seed.seed_data
```
