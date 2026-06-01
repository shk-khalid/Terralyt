import { create } from 'zustand';
import { 
  type ESGRecord, 
  type UploadHistoryItem, 
  type AuditLogItem, 
  type ValidationResult,
  type AuditTimelineEvent
} from '@/type';

export interface UserSession {
  email: string;
  name: string;
  role: 'Analyst' | 'Auditor' | 'Administrator';
  avatar?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

interface ESGState {
  records: ESGRecord[];
  uploadHistory: UploadHistoryItem[];
  auditLogs: AuditLogItem[];
  notifications: NotificationItem[];
  user: UserSession | null;
  
  // Actions
  login: (email: string, password: string) => boolean;
  logout: () => void;
  approveRecord: (recordId: string, user: string) => void;
  rejectRecord: (recordId: string, reason: string, user: string) => void;
  updateRecord: (recordId: string, updatedFields: Partial<ESGRecord>, user: string) => void;
  uploadFile: (
    fileName: string, 
    sourceType: ESGRecord['sourceType'], 
    fileSize: string, 
    recordsData: Array<Partial<ESGRecord>>, 
    user: string
  ) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

// Helper to calculate emissions based on source and raw quantity
export const calculateEmissions = (category: string, rawQuantity: number, rawUnit: string): number => {
  const quantity = Number(rawQuantity) || 0;
  switch (category) {
    case 'Purchased Electricity':
      // kg CO2e per kWh: 0.385 (Standard PGE Grid Mix)
      return Math.round((quantity * 0.385 / 1000) * 10) / 10;
    case 'Mobile Combustion':
      if (rawUnit.toLowerCase() === 'liters') {
        // ~2.68 kg CO2e per liter diesel, ~2.31 for gasoline.
        return Math.round((quantity * 2.5 * 10) / 1000) / 10;
      }
      // gallon approximation
      return Math.round((quantity * 9.5) / 1000 * 10) / 10;
    case 'Stationary Combustion':
      // natural gas m3: ~2.05 kg CO2e/m3
      return Math.round((quantity * 2.05) / 1000 * 10) / 10;
    case 'Business Travel':
      // flight passenger-miles: ~0.3 kg CO2e/mile
      return Math.round((quantity * 0.3) / 1000 * 10) / 10;
    case 'Fugitive Emissions':
      // coolant leakage: kg lost * GWP (e.g. 2088 for R-410A)
      return Math.round((quantity * 2088) / 1000 * 10) / 10;
    default:
      return Math.round((quantity * 0.5) / 1000 * 10) / 10;
  }
};

export const useESGStore = create<ESGState>((set, get) => ({
  records: [],
  uploadHistory: [],
  auditLogs: [],
  user: null,
  notifications: [
    {
      id: 'N-001',
      title: 'Anomaly Flagged in Austin Plant',
      description: 'SAP ERP Fleet Diesel data is 142% above normal baseline.',
      type: 'warning',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
      read: false
    },
    {
      id: 'N-002',
      title: 'Validation Failed for refrigerants',
      description: 'Global warming potential factor error rejected automatically.',
      type: 'error',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
      read: false
    },
    {
      id: 'N-003',
      title: 'Upload Completed',
      description: 'Lufthansa Flight Report parsed successfully with 0 errors.',
      type: 'success',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
      read: true
    }
  ],

  login: (email, password) => {
    if (email === 'analyst@terralyt.esg' && password === 'password123') {
      set({
        user: {
          email: 'analyst@terralyt.esg',
          name: 'Sarah Jenkins',
          role: 'Analyst',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
        }
      });
      return true;
    } else if (email === 'auditor@terralyt.esg' && password === 'password123') {
      set({
        user: {
          email: 'auditor@terralyt.esg',
          name: 'Marcus Vance',
          role: 'Auditor',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
        }
      });
      return true;
    }
    return false;
  },

  logout: () => set({ user: null }),

  approveRecord: (recordId, user) => {
    const timestamp = new Date().toISOString();
    
    set((state) => {
      const updatedRecords = state.records.map((rec) => {
        if (rec.id === recordId) {
          const newEvent: AuditTimelineEvent = {
            id: String(rec.auditTimeline.length + 1),
            date: timestamp,
            action: 'RECORD_APPROVED',
            user: user,
            details: 'Approved record for ESG disclosure compliance.'
          };
          return {
            ...rec,
            status: 'APPROVED' as 'APPROVED' | 'PENDING' | 'REJECTED',
            flaggedAnomaly: false, // Resolve anomaly flag on approval
            anomalyReason: null,
            validationResults: [],
            lastModifiedBy: user,
            lastModifiedDate: timestamp,
            auditTimeline: [...rec.auditTimeline, newEvent]
          };
        }
        return rec;
      });

      const newAuditLog: AuditLogItem = {
        id: `LOG-${String(state.auditLogs.length + 1).padStart(3, '0')}`,
        recordId,
        timestamp,
        action: 'RECORD_APPROVED',
        user,
        details: `Approved ESG Record ${recordId}. Status updated to APPROVED.`,
        category: 'REVIEW'
      };

      return {
        records: updatedRecords,
        auditLogs: [newAuditLog, ...state.auditLogs]
      };
    });
  },

  rejectRecord: (recordId, reason, user) => {
    const timestamp = new Date().toISOString();

    set((state) => {
      const updatedRecords = state.records.map((rec) => {
        if (rec.id === recordId) {
          const newEvent: AuditTimelineEvent = {
            id: String(rec.auditTimeline.length + 1),
            date: timestamp,
            action: 'RECORD_REJECTED',
            user: user,
            details: `Rejected. Reason: ${reason}`
          };
          const newValidation: ValidationResult = {
            type: 'error',
            message: `Rejected by auditor: ${reason}`
          };
          return {
            ...rec,
            status: 'REJECTED' as 'APPROVED' | 'PENDING' | 'REJECTED',
            validationResults: [newValidation, ...rec.validationResults],
            lastModifiedBy: user,
            lastModifiedDate: timestamp,
            auditTimeline: [...rec.auditTimeline, newEvent]
          };
        }
        return rec;
      });

      const newAuditLog: AuditLogItem = {
        id: `LOG-${String(state.auditLogs.length + 1).padStart(3, '0')}`,
        recordId,
        timestamp,
        action: 'RECORD_REJECTED',
        user,
        details: `Rejected ESG Record ${recordId}. Reason: ${reason}.`,
        category: 'REVIEW'
      };

      return {
        records: updatedRecords,
        auditLogs: [newAuditLog, ...state.auditLogs]
      };
    });
  },

  updateRecord: (recordId, updatedFields, user) => {
    const timestamp = new Date().toISOString();

    set((state) => {
      const updatedRecords = state.records.map((rec) => {
        if (rec.id === recordId) {
          // Merge fields
          const merged = { ...rec, ...updatedFields };
          
          // Re-calculate emissions if quantity or unit or category changed
          if (
            updatedFields.rawQuantity !== undefined || 
            updatedFields.rawUnit !== undefined || 
            updatedFields.category !== undefined
          ) {
            merged.emissionsValue = calculateEmissions(
              merged.category, 
              merged.rawQuantity, 
              merged.rawUnit
            );
          }

          // Create difference description for audit trail
          const changedFields: string[] = [];
          Object.keys(updatedFields).forEach((key) => {
            const k = key as keyof ESGRecord;
            if (rec[k] !== updatedFields[k]) {
              changedFields.push(`${key} (${rec[k]} -> ${updatedFields[k]})`);
            }
          });

          const details = changedFields.length > 0
            ? `Modified: ${changedFields.join(', ')}`
            : 'Saved details without modifications.';

          const newEvent: AuditTimelineEvent = {
            id: String(rec.auditTimeline.length + 1),
            date: timestamp,
            action: 'RECORD_MODIFIED',
            user: user,
            details
          };

          return {
            ...merged,
            lastModifiedBy: user,
            lastModifiedDate: timestamp,
            auditTimeline: [...rec.auditTimeline, newEvent]
          };
        }
        return rec;
      });

      const newAuditLog: AuditLogItem = {
        id: `LOG-${String(state.auditLogs.length + 1).padStart(3, '0')}`,
        recordId,
        timestamp,
        action: 'RECORD_MODIFIED',
        user,
        details: `Edited ESG Record ${recordId} fields.`,
        category: 'MODIFICATION'
      };

      return {
        records: updatedRecords,
        auditLogs: [newAuditLog, ...state.auditLogs]
      };
    });
  },

  uploadFile: (fileName, sourceType, fileSize, recordsData, user) => {
    const timestamp = new Date().toISOString();
    const uploadId = `UPL-${String(get().uploadHistory.length + 1).padStart(3, '0')}`;
    
    // Determine overall upload health status
    let status: 'SUCCESS' | 'WARNINGS' | 'FAILED' = 'SUCCESS';
    let errorsCount = 0;

    const newRecords: ESGRecord[] = recordsData.map((recData, index) => {
      const recordId = `ESG-${new Date().getFullYear()}-${String(get().records.length + index + 1).padStart(3, '0')}`;
      
      const category = recData.category || 'Purchased Electricity';
      const rawQuantity = recData.rawQuantity || 0;
      const rawUnit = recData.rawUnit || 'kWh';
      const emissionsValue = calculateEmissions(category, rawQuantity, rawUnit);

      const validationResults = recData.validationResults || [];
      if (validationResults.some(v => v.type === 'error')) {
        errorsCount++;
      } else if (validationResults.some(v => v.type === 'warning') && errorsCount === 0) {
        // If warnings, set file status to WARNINGS
      }

      return {
        id: recordId,
        sourceType,
        sourceName: fileName,
        facility: recData.facility || 'Unknown Facility',
        period: recData.period || 'Q2 2026',
        scope: recData.scope || 2,
        category,
        rawQuantity,
        rawUnit,
        emissionsValue,
        status: recData.status || 'PENDING',
        flaggedAnomaly: recData.flaggedAnomaly || false,
        anomalyReason: recData.anomalyReason || null,
        uploadedBy: user,
        uploadDate: timestamp,
        validationResults,
        rawPayload: recData.rawPayload || JSON.stringify(recData, null, 2),
        auditTimeline: [
          {
            id: '1',
            date: timestamp,
            action: 'RECORD_INGESTED',
            user: 'System Parser',
            details: `Uploaded via file ${fileName} by ${user}`
          }
        ],
        relatedRecords: []
      };
    });

    if (errorsCount > 0) {
      status = 'FAILED';
    } else if (newRecords.some(r => r.validationResults.length > 0 || r.flaggedAnomaly)) {
      status = 'WARNINGS';
    }

    const newUploadHistoryItem: UploadHistoryItem = {
      id: uploadId,
      fileName,
      sourceType,
      recordCount: recordsData.length,
      status,
      uploadedBy: user,
      uploadDate: timestamp,
      fileSize,
      errorsCount
    };

    const newAuditLog: AuditLogItem = {
      id: `LOG-${String(get().auditLogs.length + 1).padStart(3, '0')}`,
      timestamp,
      action: 'FILE_UPLOADED',
      user,
      details: `Uploaded file ${fileName} (${fileSize}) containing ${recordsData.length} records. Status: ${status}`,
      category: 'INGESTION'
    };

    const newNotification: NotificationItem = {
      id: `N-${String(get().notifications.length + 1).padStart(3, '0')}`,
      title: `File Ingestion Complete: ${fileName}`,
      description: status === 'SUCCESS' 
        ? `${recordsData.length} records successfully added.` 
        : `${recordsData.length} records processed with ${errorsCount} errors/warnings.`,
      type: status === 'SUCCESS' ? 'success' : status === 'WARNINGS' ? 'warning' : 'error',
      timestamp,
      read: false
    };

    set((state) => ({
      records: [...newRecords, ...state.records],
      uploadHistory: [newUploadHistoryItem, ...state.uploadHistory],
      auditLogs: [newAuditLog, ...state.auditLogs],
      notifications: [newNotification, ...state.notifications]
    }));
  },

  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
  })),

  clearNotifications: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true }))
  }))
}));
