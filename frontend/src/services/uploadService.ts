import { esgAxiosClient } from '@/services/api';

export interface RegisterUploadRequest {
  facility_id: string;
  source_type: string;
  file?: File;
  file_url?: string;
  file_name?: string;
}

export interface RegisterUploadResponse {
  upload_id: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;
}

export interface UploadFacilitySummary {
  id: string;
  name: string;
}

export interface UploadItem {
  id: string;
  file_name: string;
  source_type: string;
  facility: UploadFacilitySummary;
  uploaded_by: string;
  upload_date: string;
  processing_status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;
  file_url: string;
  file_size?: number;
  processing_summary?: ProcessingSummary;
}

export interface ProcessingSummary {
  total_rows: number;
  row_count: number;
  successful_rows: number;
  successful_records: number;
  failed_rows: number;
  anomaly_rows: number;
  anomalies: number;
  processing_duration: string;
}

export interface UploadDetails extends UploadItem {
  processing_summary: ProcessingSummary;
}

export interface ReprocessUploadRequest {
  file_url?: string;
}

export interface ReprocessUploadResponse {
  upload_id: string;
  status: 'PROCESSING' | string;
}

export const uploadService = {
  registerUpload: async (payload: RegisterUploadRequest): Promise<RegisterUploadResponse> => {
    console.log('POST /api/uploads/ - Registering upload and starting ingestion');
    let data: FormData | RegisterUploadRequest = payload;
    let headers = {};

    if (payload.file) {
      const formData = new FormData();
      formData.append('facility_id', payload.facility_id);
      formData.append('source_type', payload.source_type);
      formData.append('file', payload.file);
      if (payload.file_name) {
        formData.append('file_name', payload.file_name);
      }
      data = formData;
      headers = {
        'Content-Type': 'multipart/form-data',
      };
    }

    const response = await esgAxiosClient.post<RegisterUploadResponse>('/api/uploads/', data, { headers });
    return response.data;
  },

  listUploads: async (): Promise<UploadItem[]> => {
    console.log('GET /api/uploads/ - Listing uploads');
    const response = await esgAxiosClient.get<UploadItem[]>('/api/uploads/');
    return response.data;
  },

  getUploadDetails: async (id: string): Promise<UploadDetails> => {
    console.log(`GET /api/uploads/${id} - Getting upload details and summary`);
    const response = await esgAxiosClient.get<UploadDetails>(`/api/uploads/${id}`);
    return response.data;
  },

  reprocessUpload: async (id: string, payload?: ReprocessUploadRequest): Promise<ReprocessUploadResponse> => {
    console.log(`POST /api/uploads/${id}/reprocess - Triggering reprocess for upload`);
    const response = await esgAxiosClient.post<ReprocessUploadResponse>(`/api/uploads/${id}/reprocess`, payload || {});
    return response.data;
  }
};
