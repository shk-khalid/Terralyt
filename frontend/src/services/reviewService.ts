import { esgAxiosClient } from '@/services/api';

export interface ReviewFilters {
  facility?: string;
  scope?: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3' | string;
  source?: 'SAP' | 'UTILITY' | 'TRAVEL' | string;
  batch?: string;
}

export interface ReviewRecord {
  id: string;
  facility: string;
  facility_name: string;
  scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3' | string;
  activity_type: string;
  activity_date: string;
  quantity: number;
  normalized_unit: string;
  anomaly_flag: boolean;
  anomaly_reason: string | null;
  review_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  raw_payload: any;
  upload_batch_id: string;
  source_type: string;
  created_at: string;
  updated_at: string;
}

export interface AuditHistoryEvent {
  id: string;
  action_type: string;
  actor: string;
  old_value: any;
  new_value: any;
  timestamp: string;
}

export interface ReviewComment {
  id: string;
  reviewer: string;
  comment: string;
  created_at?: string;
}

export interface ReviewRecordDetail extends ReviewRecord {
  audit_history: AuditHistoryEvent[];
  review_comments: ReviewComment[];
}

export interface ApproveRecordResponse {
  message: string;
  record: {
    id: string;
    review_status: 'APPROVED';
  };
}

export interface RejectRecordRequest {
  reason: string;
}

export interface RejectRecordResponse {
  message: string;
  record: {
    id: string;
    review_status: 'REJECTED';
  };
}

export interface EditRecordRequest {
  quantity?: number;
  unit?: string;
  normalized_unit?: string;
  activity_date?: string;
}

export interface EditRecordResponse {
  message: string;
  record: {
    id: string;
    quantity: number;
    normalized_unit: string;
    review_status: string;
  };
}

export const reviewService = {
  getPendingRecords: async (filters?: ReviewFilters): Promise<ReviewRecord[]> => {
    console.log('GET /api/review/pending - Retrieving pending records with filters', filters);
    const response = await esgAxiosClient.get<ReviewRecord[]>('/api/review/pending', {
      params: filters
    });
    return response.data;
  },

  getAnomaliesList: async (): Promise<ReviewRecord[]> => {
    console.log('GET /api/review/anomalies - Retrieving anomalous records');
    const response = await esgAxiosClient.get<ReviewRecord[]>('/api/review/anomalies');
    return response.data;
  },

  getRecordDetail: async (id: string): Promise<ReviewRecordDetail> => {
    console.log(`GET /api/review/${id} - Retrieving record details`);
    const response = await esgAxiosClient.get<ReviewRecordDetail>(`/api/review/${id}`);
    return response.data;
  },

  approveRecord: async (id: string): Promise<ApproveRecordResponse> => {
    console.log(`POST /api/review/${id}/approve - Approving emission record`);
    const response = await esgAxiosClient.post<ApproveRecordResponse>(`/api/review/${id}/approve`);
    return response.data;
  },

  rejectRecord: async (id: string, payload: RejectRecordRequest): Promise<RejectRecordResponse> => {
    console.log(`POST /api/review/${id}/reject - Rejecting emission record`, payload);
    const response = await esgAxiosClient.post<RejectRecordResponse>(`/api/review/${id}/reject`, payload);
    return response.data;
  },

  correctRecord: async (id: string, payload: EditRecordRequest): Promise<EditRecordResponse> => {
    console.log(`PATCH /api/review/${id}/edit - Correcting/Editing emission record`, payload);
    const response = await esgAxiosClient.patch<EditRecordResponse>(`/api/review/${id}/edit`, payload);
    return response.data;
  }
};
