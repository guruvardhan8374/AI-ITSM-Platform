import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { IncidentListPage } from '../pages/IncidentListPage';
import { IncidentDetailPage } from '../pages/IncidentDetailPage';
import { ServiceCatalogPage } from '../pages/ServiceCatalogPage';
import { ServiceRequestListPage } from '../pages/ServiceRequestListPage';
import { ServiceRequestDetailPage } from '../pages/ServiceRequestDetailPage';
import { ProblemListPage } from '../pages/ProblemListPage';
import { ProblemDetailPage } from '../pages/ProblemDetailPage';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage';
import { KnowledgeArticleDetailPage } from '../pages/KnowledgeArticleDetailPage';
import { ChangeListPage } from '../pages/ChangeListPage';
import { ChangeDetailPage } from '../pages/ChangeDetailPage';
import { AssetListPage } from '../pages/AssetListPage';
import { AssetDetailPage } from '../pages/AssetDetailPage';
import { InfrastructureMonitoringPage } from '../pages/InfrastructureMonitoringPage';
import { ReportsPage } from '../pages/ReportsPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { UserManagementPage } from '../pages/UserManagementPage';
import { RoleManagementPage } from '../pages/RoleManagementPage';
import { BusinessUnitPage } from '../pages/BusinessUnitPage';
import { DepartmentPage } from '../pages/DepartmentPage';
import { TeamManagementPage } from '../pages/TeamManagementPage';
import { TeamDetailPage } from '../pages/TeamDetailPage';
import { SLAPoliciesPage } from '../pages/SLAPoliciesPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { SettingsPage } from '../pages/SettingsPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Protected ITSM Console Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                
                {/* Full Incident Management Module */}
                <Route path="/incidents" element={<IncidentListPage />} />
                <Route path="/incidents/:id" element={<IncidentDetailPage />} />

                {/* Full Service Request Management Module */}
                <Route path="/service-catalog" element={<ServiceCatalogPage />} />
                <Route path="/service-requests" element={<ServiceRequestListPage />} />
                <Route path="/service-requests/:id" element={<ServiceRequestDetailPage />} />

                {/* Full Problem Management Module */}
                <Route path="/problems" element={<ProblemListPage />} />
                <Route path="/problems/:id" element={<ProblemDetailPage />} />

                {/* Full Knowledge Base Module */}
                <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                <Route path="/knowledge-base/:id" element={<KnowledgeArticleDetailPage />} />
                <Route path="/kb" element={<Navigate to="/knowledge-base" replace />} />

                {/* Full Change Management Module */}
                <Route path="/changes" element={<ChangeListPage />} />
                <Route path="/changes/:id" element={<ChangeDetailPage />} />

                {/* Full IT Asset Management Module */}
                <Route path="/assets" element={<AssetListPage />} />
                <Route path="/assets/:id" element={<AssetDetailPage />} />

                {/* Full Infrastructure Monitoring NOC Module */}
                <Route path="/infra" element={<InfrastructureMonitoringPage />} />
                <Route path="/infrastructure" element={<Navigate to="/infra" replace />} />

                {/* Full Reports & Analytics Module */}
                <Route path="/reports" element={<ReportsPage />} />

                {/* Full Audit Log Management Module */}
                <Route path="/audit-logs" element={<AuditLogsPage />} />

                {/* Full Organization & User Management Modules */}
                <Route path="/users" element={<UserManagementPage />} />
                <Route path="/roles" element={<RoleManagementPage />} />
                <Route path="/business-units" element={<BusinessUnitPage />} />
                <Route path="/departments" element={<DepartmentPage />} />
                <Route path="/teams" element={<TeamManagementPage />} />
                <Route path="/teams/:id" element={<TeamDetailPage />} />

                {/* SLA Governance & Notifications */}
                <Route path="/sla-policies" element={<SLAPoliciesPage />} />
                <Route path="/sla" element={<Navigate to="/sla-policies" replace />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
