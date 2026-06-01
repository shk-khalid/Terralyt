import { esgAxiosClient } from '@/services/api';

export interface AuditLogFilters {
  action?: 'CREATED' | 'UPDATED' | 'APPROVED' | 'REJECTED' | 'LOCKED' | 'UPLOADED' | string;
  user?: string;
  start_date?: string;
  end_date?: string;
}

export interface AffectedObject {
  type: string;
  id: string;
  scope: string;
  activity_type: string;
}

export interface AuditLog {
  id: string;
  acted_by: string;
  actor: string;
  tenant: string;
  tenant_name: string;
  action_type: string;
  action: string;
  old_value: any;
  new_value: any;
  timestamp: string;
  object_affected: AffectedObject;
}

export const auditLogService = {
  listAuditLogs: async (filters?: AuditLogFilters): Promise<AuditLog[]> => {
    console.log('GET /api/audit-logs - Listing audit logs with filters', filters);
    const response = await esgAxiosClient.get<AuditLog[]>('/api/audit-logs', {
      params: filters
    });
    return response.data;
  },

  getAuditLogDetails: async (id: string): Promise<AuditLog> => {
    console.log(`GET /api/audit-logs/${id} - Retrieving audit log details`);
    const response = await esgAxiosClient.get<AuditLog>(`/api/audit-logs/${id}`);
    return response.data;
  }
};
