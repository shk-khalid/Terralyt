import * as React from 'react';
import { useAuth } from './AuthContext';
import { facilityService, type Facility, type CreateFacilityRequest, type UpdateFacilityRequest } from '@/services/facilityService';
import { uploadService, type UploadItem, type RegisterUploadRequest, type ReprocessUploadRequest } from '@/services/uploadService';
import { reviewService, type ReviewRecord, type ReviewFilters, type EditRecordRequest } from '@/services/reviewService';
import { dashboardService, type DashboardSummary, type ScopeMetrics, type FacilityComparison, type Trends } from '@/services/dashboardService';
import { auditLogService, type AuditLog, type AuditLogFilters } from '@/services/auditLogService';

interface ESGDataContextType {
  // Facilities
  facilities: Facility[];
  facilitiesLoading: boolean;
  fetchFacilities: () => Promise<void>;
  createFacility: (data: CreateFacilityRequest) => Promise<Facility>;
  updateFacility: (id: string, data: UpdateFacilityRequest) => Promise<Facility>;
  deleteFacility: (id: string) => Promise<void>;

  // Uploads
  uploads: UploadItem[];
  uploadsLoading: boolean;
  fetchUploads: () => Promise<void>;
  registerUpload: (data: RegisterUploadRequest) => Promise<string>;
  reprocessUpload: (id: string, data?: ReprocessUploadRequest) => Promise<void>;

  // Review (Records & Anomalies)
  pendingRecords: ReviewRecord[];
  pendingRecordsLoading: boolean;
  fetchPendingRecords: (filters?: ReviewFilters) => Promise<void>;
  anomalies: ReviewRecord[];
  anomaliesLoading: boolean;
  fetchAnomalies: () => Promise<void>;
  approveRecord: (id: string) => Promise<void>;
  rejectRecord: (id: string, reason: string) => Promise<void>;
  correctRecord: (id: string, data: EditRecordRequest) => Promise<void>;

  // Dashboard Stats
  dashboardSummary: DashboardSummary | null;
  scopeMetrics: ScopeMetrics | null;
  facilityComparison: FacilityComparison | null;
  trends: Trends | null;
  dashboardLoading: boolean;
  fetchDashboardData: () => Promise<void>;

  // Audit Logs
  auditLogs: AuditLog[];
  auditLogsLoading: boolean;
  fetchAuditLogs: (filters?: AuditLogFilters) => Promise<void>;

  // Global triggers
  refreshAll: () => void;
}

const ESGDataContext = React.createContext<ESGDataContextType | undefined>(undefined);

export const ESGDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // State definitions
  const [facilities, setFacilities] = React.useState<Facility[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = React.useState<boolean>(false);

  const [uploads, setUploads] = React.useState<UploadItem[]>([]);
  const [uploadsLoading, setUploadsLoading] = React.useState<boolean>(false);

  const [pendingRecords, setPendingRecords] = React.useState<ReviewRecord[]>([]);
  const [pendingRecordsLoading, setPendingRecordsLoading] = React.useState<boolean>(false);

  const [anomalies, setAnomalies] = React.useState<ReviewRecord[]>([]);
  const [anomaliesLoading, setAnomaliesLoading] = React.useState<boolean>(false);

  const [dashboardSummary, setDashboardSummary] = React.useState<DashboardSummary | null>(null);
  const [scopeMetrics, setScopeMetrics] = React.useState<ScopeMetrics | null>(null);
  const [facilityComparison, setFacilityComparison] = React.useState<FacilityComparison | null>(null);
  const [trends, setTrends] = React.useState<Trends | null>(null);
  const [dashboardLoading, setDashboardLoading] = React.useState<boolean>(false);

  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = React.useState<boolean>(false);

  // Core API Ingestion triggers
  const fetchFacilities = React.useCallback(async () => {
    setFacilitiesLoading(true);
    try {
      const data = await facilityService.listFacilities();
      setFacilities(data);
    } catch (err) {
      console.error('Failed to fetch facilities:', err);
    } finally {
      setFacilitiesLoading(false);
    }
  }, []);

  const createFacility = async (data: CreateFacilityRequest): Promise<Facility> => {
    try {
      const newFac = await facilityService.createFacility(data);
      setFacilities((prev) => [newFac, ...prev]);
      return newFac;
    } catch (err) {
      console.error('Failed to create facility:', err);
      throw err;
    }
  };

  const updateFacility = async (id: string, data: UpdateFacilityRequest): Promise<Facility> => {
    try {
      const updated = await facilityService.updateFacility(id, data);
      setFacilities((prev) => prev.map((f) => (f.id === id ? updated : f)));
      return updated;
    } catch (err) {
      console.error('Failed to update facility:', err);
      throw err;
    }
  };

  const deleteFacility = async (id: string): Promise<void> => {
    try {
      await facilityService.deleteFacility(id);
      setFacilities((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error('Failed to delete facility:', err);
      throw err;
    }
  };

  const fetchUploads = React.useCallback(async () => {
    setUploadsLoading(true);
    try {
      const data = await uploadService.listUploads();
      setUploads(data);
    } catch (err) {
      console.error('Failed to fetch uploads:', err);
    } finally {
      setUploadsLoading(false);
    }
  }, []);

  const registerUpload = async (data: RegisterUploadRequest): Promise<string> => {
    try {
      const res = await uploadService.registerUpload(data);
      fetchUploads(); // Refresh the list of uploads
      return res.upload_id;
    } catch (err) {
      console.error('Failed to register upload:', err);
      throw err;
    }
  };

  const reprocessUpload = async (id: string, data?: ReprocessUploadRequest): Promise<void> => {
    try {
      await uploadService.reprocessUpload(id, data);
      fetchUploads(); // Refresh status
    } catch (err) {
      console.error('Failed to reprocess upload:', err);
      throw err;
    }
  };

  const fetchPendingRecords = React.useCallback(async (filters?: ReviewFilters) => {
    setPendingRecordsLoading(true);
    try {
      const data = await reviewService.getPendingRecords(filters);
      setPendingRecords(data);
    } catch (err) {
      console.error('Failed to fetch pending review records:', err);
    } finally {
      setPendingRecordsLoading(false);
    }
  }, []);

  const fetchAnomalies = React.useCallback(async () => {
    setAnomaliesLoading(true);
    try {
      const data = await reviewService.getAnomaliesList();
      setAnomalies(data);
    } catch (err) {
      console.error('Failed to fetch anomalies list:', err);
    } finally {
      setAnomaliesLoading(false);
    }
  }, []);

  const approveRecord = async (id: string): Promise<void> => {
    try {
      await reviewService.approveRecord(id);
      // Remove from pending locally or update status
      setPendingRecords((prev) => prev.filter((r) => r.id !== id));
      setAnomalies((prev) => prev.filter((r) => r.id !== id));
      // Refresh dashboard & logs
      fetchDashboardData();
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to approve record:', err);
      throw err;
    }
  };

  const rejectRecord = async (id: string, reason: string): Promise<void> => {
    try {
      await reviewService.rejectRecord(id, { reason });
      // Remove from pending locally
      setPendingRecords((prev) => prev.filter((r) => r.id !== id));
      setAnomalies((prev) => prev.filter((r) => r.id !== id));
      // Refresh dashboard & logs
      fetchDashboardData();
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to reject record:', err);
      throw err;
    }
  };

  const correctRecord = async (id: string, data: EditRecordRequest): Promise<void> => {
    try {
      const res = await reviewService.correctRecord(id, data);
      
      // Update locally
      setPendingRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                quantity: res.record.quantity,
                normalized_unit: res.record.normalized_unit,
                review_status: res.record.review_status as any,
              }
            : r
        )
      );

      // Re-fetch anomalies in case it was fixed or became an anomaly
      fetchAnomalies();
      fetchDashboardData();
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to correct record:', err);
      throw err;
    }
  };

  const fetchDashboardData = React.useCallback(async () => {
    setDashboardLoading(true);
    try {
      const [summary, scopes, facilitiesComp, trendsData] = await Promise.all([
        dashboardService.getDashboardSummary(),
        dashboardService.getScopeMetrics(),
        dashboardService.getFacilityComparison(),
        dashboardService.getTrends()
      ]);
      setDashboardSummary(summary);
      setScopeMetrics(scopes);
      setFacilityComparison(facilitiesComp);
      setTrends(trendsData);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const fetchAuditLogs = React.useCallback(async (filters?: AuditLogFilters) => {
    setAuditLogsLoading(true);
    try {
      const data = await auditLogService.listAuditLogs(filters);
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setAuditLogsLoading(false);
    }
  }, []);

  const refreshAll = React.useCallback(() => {
    if (user) {
      fetchFacilities();
      fetchUploads();
      fetchPendingRecords();
      fetchAnomalies();
      fetchDashboardData();
      fetchAuditLogs();
    }
  }, [
    user,
    fetchFacilities,
    fetchUploads,
    fetchPendingRecords,
    fetchAnomalies,
    fetchDashboardData,
    fetchAuditLogs
  ]);

  // Sync ingestion triggers when authenticated user is detected
  React.useEffect(() => {
    if (user) {
      refreshAll();
    } else {
      // Clear data states
      setFacilities([]);
      setUploads([]);
      setPendingRecords([]);
      setAnomalies([]);
      setDashboardSummary(null);
      setScopeMetrics(null);
      setFacilityComparison(null);
      setTrends(null);
      setAuditLogs([]);
    }
  }, [user, refreshAll]);

  return (
    <ESGDataContext.Provider
      value={{
        facilities,
        facilitiesLoading,
        fetchFacilities,
        createFacility,
        updateFacility,
        deleteFacility,
        uploads,
        uploadsLoading,
        fetchUploads,
        registerUpload,
        reprocessUpload,
        pendingRecords,
        pendingRecordsLoading,
        fetchPendingRecords,
        anomalies,
        anomaliesLoading,
        fetchAnomalies,
        approveRecord,
        rejectRecord,
        correctRecord,
        dashboardSummary,
        scopeMetrics,
        facilityComparison,
        trends,
        dashboardLoading,
        fetchDashboardData,
        auditLogs,
        auditLogsLoading,
        fetchAuditLogs,
        refreshAll
      }}
    >
      {children}
    </ESGDataContext.Provider>
  );
};

export const useESGData = () => {
  const context = React.useContext(ESGDataContext);
  if (context === undefined) {
    throw new Error('useESGData must be used within an ESGDataProvider');
  }
  return context;
};
