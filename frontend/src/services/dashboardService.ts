import { esgAxiosClient } from '@/services/api';

export interface DashboardSummary {
  "Total Uploads": number;
  total_uploads: number;
  "Total Records": number;
  total_records: number;
  "Approved Records": number;
  approved_records: number;
  "Pending Reviews": number;
  pending_reviews: number;
  "Rejected Records": number;
  rejected_records: number;
  "Anomalies": number;
  anomalies: number;
  avg_processing_time?: number;
}

export interface ScopeMetrics {
  "Scope 1 totals": number;
  "Scope 2 totals": number;
  "Scope 3 totals": number;
  scope_1_totals: number;
  scope_2_totals: number;
  scope_3_totals: number;
  "Scope 1": number;
  "Scope 2": number;
  "Scope 3": number;
}

export interface FacilityComparison {
  [facilityName: string]: number;
}

export interface MonthlyEmission {
  month: string;
  emissions: number;
}

export interface MonthlyUpload {
  month: string;
  uploads: number;
}

export interface MonthlyAnomaly {
  month: string;
  anomalies: number;
}

export interface Trends {
  monthly_emissions: MonthlyEmission[];
  uploads_per_month: MonthlyUpload[];
  anomaly_trends: MonthlyAnomaly[];
}

export const dashboardService = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    console.log('GET /api/dashboard/summary - Retrieving dashboard summary cards');
    const response = await esgAxiosClient.get<DashboardSummary>('/api/dashboard/summary');
    return response.data;
  },

  getScopeMetrics: async (): Promise<ScopeMetrics> => {
    console.log('GET /api/dashboard/scopes - Retrieving scope aggregate metrics');
    const response = await esgAxiosClient.get<ScopeMetrics>('/api/dashboard/scopes');
    return response.data;
  },

  getFacilityComparison: async (): Promise<FacilityComparison> => {
    console.log('GET /api/dashboard/facilities - Retrieving facility aggregated comparison');
    const response = await esgAxiosClient.get<FacilityComparison>('/api/dashboard/facilities');
    return response.data;
  },

  getTrends: async (): Promise<Trends> => {
    console.log('GET /api/dashboard/trends - Retrieving time-series trends');
    const response = await esgAxiosClient.get<Trends>('/api/dashboard/trends');
    return response.data;
  }
};
