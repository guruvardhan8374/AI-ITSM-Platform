export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  database_status: string;
}

export type RoleName = 
  | 'Super Admin' 
  | 'IT Manager' 
  | 'Service Desk Agent' 
  | 'IT Support Engineer' 
  | 'Infrastructure Engineer' 
  | 'Change Manager' 
  | 'End User';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
  department: string;
  businessUnit: string;
  avatarUrl?: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: string | number;
  category?: 'core' | 'management' | 'ai' | 'analytics' | 'admin';
}
