import { apiClient } from './api';
import { HealthCheckResponse } from '../types';

export const fetchHealthCheck = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await apiClient.get<HealthCheckResponse>('/health');
    return response.data;
  } catch (error) {
    return {
      status: 'offline',
      service: 'ITSM Platform API',
      version: '1.0.0',
      environment: 'development',
      timestamp: new Date().toISOString(),
      database_status: 'disconnected',
    };
  }
};
