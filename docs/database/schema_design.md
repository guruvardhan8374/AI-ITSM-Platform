# Database Schema Design - AI ITSM Platform

## Entity Relationship Overview

1. **User & RBAC**:
   - `User` N:1 `Role`
   - `Role` N:M `Permission` (via `role_permissions`)
   - `User` N:1 `Department`
   - `Department` N:1 `BusinessUnit`
   - `User` N:M `Team` (via `user_teams`)

2. **Incident Management**:
   - `Incident` N:1 `User` (Reporter & Assignee)
   - `Incident` 1:N `IncidentComment`
   - `Incident` 1:N `IncidentHistory`

3. **Change Management**:
   - `Change` 1:N `ChangeApproval` (Approver `User`)

4. **Assets & Infra**:
   - `Asset` 1:N `AssetHistory`
   - `InfrastructureResource` 1:N `InfrastructureMetric`
   - `InfrastructureResource` 1:N `Alert`
