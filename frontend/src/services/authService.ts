import { esgAxiosClient } from '@/services/api';

// --- AUTHENTICATION INTERFACES ---
export interface TenantInfo {
  id: string;
  company_name: string;
  industry: string;
  is_active: boolean;
  baseline_year: number;
  target_year: number;
  reduction_target: number;
  emissions_standard: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'ANALYST' | 'REVIEWER' | 'Analyst' | 'Auditor' | 'Administrator';
  tenant: TenantInfo;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: UserProfile;
}

export interface RegisterTenantPayload {
  company_name: string;
  industry: string;
  admin_name: string;
  admin_email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RefreshTokenPayload {
  refresh?: string;
}

export interface RefreshTokenResponse {
  access: string;
}

export interface CreateUserPayload {
  email: string;
  full_name: string;
  role: 'ANALYST' | 'REVIEWER' | 'ADMIN';
  password: string;
}

// --- AUTH SERVICE LAYER ---
export const authService = {
  registerTenant: async (payload: RegisterTenantPayload): Promise<{ user: UserProfile }> => {
    console.log('POST /api/auth/register-tenant/ - Registering tenant organization');
    const response = await esgAxiosClient.post<{ user: UserProfile }>('/api/auth/register-tenant/', payload);
    return response.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    console.log('POST /api/auth/login/ - User authentication');
    const response = await esgAxiosClient.post<AuthResponse>('/api/auth/login/', payload);
    return response.data;
  },

  logout: async (): Promise<void> => {
    console.log('POST /api/auth/logout/ - Logging out from backend');
    await esgAxiosClient.post('/api/auth/logout/');
  },

  getCurrentUser: async (accessToken: string): Promise<UserProfile> => {
    console.log('GET /api/auth/me/ - Retrieving authenticated profile');
    const response = await esgAxiosClient.get<UserProfile>('/api/auth/me/', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return response.data;
  },

  refreshToken: async (payload: RefreshTokenPayload): Promise<RefreshTokenResponse> => {
    console.log('POST /api/auth/token/refresh/ - Refreshing JWT token');
    const response = await esgAxiosClient.post<RefreshTokenResponse>('/api/auth/token/refresh/', payload);
    return response.data;
  },

  createUser: async (payload: CreateUserPayload, accessToken: string): Promise<UserProfile> => {
    console.log('POST /api/users/create/ - Admin provisioning new user');
    const response = await esgAxiosClient.post<UserProfile>('/api/users/create/', payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return response.data;
  },

  listUsers: async (accessToken: string): Promise<UserProfile[]> => {
    console.log('GET /api/users/ - Listing tenant users');
    const response = await esgAxiosClient.get<UserProfile[]>('/api/users/', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return response.data;
  },

  getTenantDetails: async (accessToken: string): Promise<TenantInfo> => {
    console.log('GET /api/tenant/ - Retrieving tenant workspace settings');
    const response = await esgAxiosClient.get<TenantInfo>('/api/tenant/', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return response.data;
  },

  updateTenantDetails: async (
    payload: { baseline_year?: number; target_year?: number; reduction_target?: number; emissions_standard?: string },
    accessToken: string
  ): Promise<TenantInfo> => {
    console.log('PATCH /api/tenant/ - Updating tenant workspace settings');
    const response = await esgAxiosClient.patch<TenantInfo>('/api/tenant/', payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return response.data;
  }
};
