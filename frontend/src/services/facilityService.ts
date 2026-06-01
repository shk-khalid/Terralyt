import { esgAxiosClient } from '@/services/api';

export interface Facility {
  id: string;
  name: string;
  facility_type: string;
  location: string;
  created_at: string;
}

export interface CreateFacilityRequest {
  name: string;
  facility_type: string;
  location: string;
}

export interface UpdateFacilityRequest {
  name?: string;
  facility_type?: string;
  location?: string;
}

export const facilityService = {
  createFacility: async (payload: CreateFacilityRequest): Promise<Facility> => {
    console.log('POST /api/facilities/ - Creating a new facility');
    const response = await esgAxiosClient.post<Facility>('/api/facilities/', payload);
    return response.data;
  },

  listFacilities: async (): Promise<Facility[]> => {
    console.log('GET /api/facilities/ - Listing all facilities');
    const response = await esgAxiosClient.get<Facility[]>('/api/facilities/');
    return response.data;
  },

  getFacilityDetails: async (id: string): Promise<Facility> => {
    console.log(`GET /api/facilities/${id}/ - Retrieving facility details`);
    const response = await esgAxiosClient.get<Facility>(`/api/facilities/${id}/`);
    return response.data;
  },

  updateFacility: async (id: string, payload: UpdateFacilityRequest): Promise<Facility> => {
    console.log(`PATCH /api/facilities/${id}/ - Updating facility`);
    const response = await esgAxiosClient.patch<Facility>(`/api/facilities/${id}/`, payload);
    return response.data;
  },

  deleteFacility: async (id: string): Promise<void> => {
    console.log(`DELETE /api/facilities/${id}/ - Deleting facility (soft delete)`);
    await esgAxiosClient.delete(`/api/facilities/${id}/`);
  }
};
