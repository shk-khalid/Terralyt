import axios from 'axios';
import { useESGStore } from '@/store/esgStore';
import type { ESGRecord } from '@/type';

// Configure Axios client matching enterprise setup
let apiToken: string | null = null;

export const setApiToken = (token: string | null) => {
  apiToken = token;
};

export const esgAxiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor to automatically attach authorization header
esgAxiosClient.interceptors.request.use(
  (config) => {
    if (apiToken) {
      config.headers.Authorization = `Bearer ${apiToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper to generate mock parsed rows based on the uploaded file type
const generateMockUploadedRecords = (_fileName: string, sourceType: ESGRecord['sourceType']): Array<Partial<ESGRecord>> => {
  const period = 'Q2 2026';
  
  if (sourceType === 'sap_erp') {
    return [
      {
        facility: 'Munich HQ',
        period,
        scope: 1,
        category: 'Mobile Combustion',
        rawQuantity: 11400,
        rawUnit: 'Liters',
        status: 'PENDING',
        flaggedAnomaly: false,
        anomalyReason: null,
        validationResults: [],
        rawPayload: JSON.stringify({ cost_center: 'CC-DE-MUN-01', fuel_type: 'Gasoline', liters: 11400, year: 2026 }, null, 2)
      },
      {
        facility: 'Austin Plant',
        period,
        scope: 1,
        category: 'Mobile Combustion',
        rawQuantity: 32000,
        rawUnit: 'Liters',
        status: 'PENDING',
        flaggedAnomaly: true,
        anomalyReason: 'Reading exceeds typical peak capacity (+170% vs baseline)',
        validationResults: [
          { type: 'warning', message: 'Fleet fuel utilization exceeds registered diesel vehicle total.' }
        ],
        rawPayload: JSON.stringify({ cost_center: 'CC-US-AUS-02', fuel_type: 'Diesel', liters: 32000, year: 2026 }, null, 2)
      }
    ];
  } else if (sourceType === 'utility_bill') {
    return [
      {
        facility: 'London Office',
        period,
        scope: 2,
        category: 'Purchased Electricity',
        rawQuantity: 45000,
        rawUnit: 'kWh',
        status: 'PENDING',
        flaggedAnomaly: false,
        anomalyReason: null,
        validationResults: [],
        rawPayload: JSON.stringify({ account: 'UK-ELEC-8812', usage_kwh: 45000, supplier: 'UK Grid Power' }, null, 2)
      }
    ];
  } else if (sourceType === 'travel_log') {
    return [
      {
        facility: 'Global Corporate',
        period,
        scope: 3,
        category: 'Business Travel',
        rawQuantity: 185000,
        rawUnit: 'Passenger-Miles',
        status: 'PENDING',
        flaggedAnomaly: false,
        anomalyReason: null,
        validationResults: [
          { type: 'warning', message: 'Calculated using fallback long-haul radiative forcing factor.' }
        ],
        rawPayload: JSON.stringify({ flights_recorded: 42, airlines: ['British Airways', 'United'], passenger_miles: 185000 }, null, 2)
      }
    ];
  } else {
    // Custom CSV
    return [
      {
        facility: 'Singapore Hub',
        period,
        scope: 1,
        category: 'Fugitive Emissions',
        rawQuantity: 4.2,
        rawUnit: 'kg',
        status: 'PENDING',
        flaggedAnomaly: false,
        anomalyReason: null,
        validationResults: [],
        rawPayload: JSON.stringify({ equipment_id: 'AC-SG-04', gas_leak: 'R-134a', kg_replaced: 4.2 }, null, 2)
      }
    ];
  }
};

// API Service layer wrapping Axios configuration (with simulated server processing latency)
export const esgApiService = {
  fetchRecords: async (): Promise<ESGRecord[]> => {
    console.log('GET /v1/records - Initiated via Axios config');
    await new Promise((resolve) => setTimeout(resolve, 300));
    return useESGStore.getState().records;
  },

  approveRecord: async (recordId: string, analystName: string): Promise<boolean> => {
    console.log(`POST /v1/records/${recordId}/approve - Initiated via Axios config`);
    await new Promise((resolve) => setTimeout(resolve, 400));
    useESGStore.getState().approveRecord(recordId, analystName);
    return true;
  },

  rejectRecord: async (recordId: string, reason: string, analystName: string): Promise<boolean> => {
    console.log(`POST /v1/records/${recordId}/reject - Initiated via Axios config`, { reason });
    await new Promise((resolve) => setTimeout(resolve, 400));
    useESGStore.getState().rejectRecord(recordId, reason, analystName);
    return true;
  },

  updateRecord: async (recordId: string, updatedFields: Partial<ESGRecord>, analystName: string): Promise<boolean> => {
    console.log(`PUT /v1/records/${recordId} - Initiated via Axios config`, updatedFields);
    await new Promise((resolve) => setTimeout(resolve, 500));
    useESGStore.getState().updateRecord(recordId, updatedFields, analystName);
    return true;
  },

  uploadFile: async (file: { name: string; size: number }, sourceType: ESGRecord['sourceType'], analystName: string): Promise<{ success: boolean; count: number }> => {
    console.log(`POST /v1/ingest - Uploading file: ${file.name} (${file.size} bytes) via Axios config`);
    
    // Simulate server ingestion and validation delay (longer for CSV parsing and check scripts)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const fileSizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;
    
    const parsedRecordsData = generateMockUploadedRecords(file.name, sourceType);
    
    useESGStore.getState().uploadFile(
      file.name,
      sourceType,
      fileSizeStr,
      parsedRecordsData,
      analystName
    );

    return {
      success: true,
      count: parsedRecordsData.length
    };
  }
};
