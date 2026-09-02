import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertOctagon, 
  ShoppingBag, 
  AlertTriangle, 
  GitPullRequest, 
  HardDrive, 
  Server, 
  BrainCircuit, 
  Clock, 
  Bell, 
  BookOpen, 
  BarChart3, 
  Shield, 
  Users, 
  Key,
  Building2, 
  Briefcase, 
  UserCheck,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { hasPermission } = useAuth();

  const navigation: NavSection[] = [
    {
      title: "Core ITSM",
      items: [
        { name: "Dashboard", path: "/", icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: "Incidents", path: "/incidents", icon: <AlertOctagon className="w-4 h-4" /> },
        { name: "Service Requests", path: "/service-requests", icon: <ShoppingBag className="w-4 h-4" /> },
        { name: "Service Catalog", path: "/service-catalog", icon: <ShoppingBag className="w-4 h-4" /> },
        { name: "Problem Management", path: "/problems", icon: <AlertTriangle className="w-4 h-4" /> },
        { name: "Change Management", path: "/changes", icon: <GitPullRequest className="w-4 h-4" /> },
      ]
    },
    {
      title: "IT Assets & Infra",
      items: [
        { name: "Asset Management", path: "/assets", icon: <HardDrive className="w-4 h-4" /> },
        { name: "Infrastructure NOC", path: "/infra", icon: <Server className="w-4 h-4" /> },
      ]
    },
    {
      title: "Governance & Analytics",
      items: [
        { name: "Reports & Analytics", path: "/reports", icon: <BarChart3 className="w-4 h-4" />, permission: "reports.view" },
        { name: "Audit Logs", path: "/audit-logs", icon: <Shield className="w-4 h-4" />, permission: "audit_logs.view" },
        { name: "SLA Governance", path: "/sla-policies", icon: <Clock className="w-4 h-4" /> },
        { name: "Knowledge Base", path: "/knowledge-base", icon: <BookOpen className="w-4 h-4" /> },
        { name: "Notifications", path: "/notifications", icon: <Bell className="w-4 h-4" /> },
        { name: "System Settings", path: "/settings", icon: <Settings className="w-4 h-4" /> },
      ]
    },
    {
      title: "Organization",
      items: [
        { name: "Users", path: "/users", icon: <Users className="w-4 h-4" />, permission: "users.view" },
        { name: "Roles & Permissions", path: "/roles", icon: <Key className="w-4 h-4" />, permission: "users.view" },
        { name: "Business Units", path: "/business-units", icon: <Building2 className="w-4 h-4" />, permission: "users.view" },
        { name: "Departments", path: "/departments", icon: <Briefcase className="w-4 h-4" />, permission: "users.view" },
        { name: "Support Teams", path: "/teams", icon: <UserCheck className="w-4 h-4" />, permission: "users.view" },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <BrainCircuit className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-100 tracking-wide">ITOps AI Engine</h1>
          <p className="text-[10px] text-slate-400 font-mono">v1.0.0 • Production</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {navigation.map((section, idx) => {
          const visibleItems = section.items.filter(
            item => !item.permission || hasPermission(item.permission)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1.5">
              <h2 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {section.title}
              </h2>
              <nav className="space-y-1">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
