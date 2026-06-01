export interface ValidationResult {
  type: 'error' | 'warning';
  message: string;
}

export interface AuditTimelineEvent {
  id: string;
  date: string;
  action: string;
  user: string;
  details: string;
}

export interface ESGRecord {
  id: string;
  sourceType: 'sap_erp' | 'utility_bill' | 'travel_log' | 'custom_csv';
  sourceName: string;
  facility: string;
  period: string;
  scope: 1 | 2 | 3;
  category: string;
  rawQuantity: number;
  rawUnit: string;
  emissionsValue: number; // in tCO2e
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  flaggedAnomaly: boolean;
  anomalyReason: string | null;
  uploadedBy: string;
  uploadDate: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  validationResults: ValidationResult[];
  rawPayload: string;
  auditTimeline: AuditTimelineEvent[];
  relatedRecords: string[];
}

export interface UploadHistoryItem {
  id: string;
  fileName: string;
  sourceType: 'sap_erp' | 'utility_bill' | 'travel_log' | 'custom_csv';
  recordCount: number;
  status: 'SUCCESS' | 'WARNINGS' | 'FAILED';
  uploadedBy: string;
  uploadDate: string;
  fileSize: string;
  errorsCount: number;
}

export interface AuditLogItem {
  id: string;
  recordId?: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  category: 'INGESTION' | 'REVIEW' | 'MODIFICATION' | 'SYSTEM' | 'SETTINGS';
}
