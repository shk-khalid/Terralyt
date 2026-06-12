import * as React from 'react';
import { 
  authService, 
  type UserProfile, 
  type LoginPayload, 
  type RegisterTenantPayload,
  type AuthResponse,
  type CreateUserPayload
} from '@/services/authService';
import { useESGStore } from '@/store/esgStore';
import { setApiToken } from '@/services/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  registerTenant: (payload: RegisterTenantPayload) => Promise<void>;
  logout: () => Promise<void>;
  accessToken: string | null;
  createUser: (payload: CreateUserPayload) => Promise<UserProfile>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const mapRole = (role: string): 'Analyst' | 'Auditor' | 'Administrator' => {
  if (role === 'ADMIN' || role === 'Administrator') return 'Administrator';
  if (role === 'REVIEWER' || role === 'Auditor') return 'Auditor';
  return 'Analyst';
};

// Cookie management helpers
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  // Sync token with Axios interceptor
  React.useEffect(() => {
    setApiToken(accessToken);
  }, [accessToken]);

  // Sync session with Zustand store
  const syncWithZustandStore = (profile: UserProfile | null) => {
    if (profile) {
      useESGStore.setState({
        user: {
          email: profile.email,
          name: profile.full_name,
          role: mapRole(profile.role),
          avatar: profile.email === 'analyst@terralyt.esg' 
            ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' 
            : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
        }
      });
    } else {
      useESGStore.setState({ user: null });
    }
  };

  // Attempt to restore session on mount
  React.useEffect(() => {
    const initAuth = async () => {
      try {
        const storedRefreshToken = getCookie('refresh_token');
        if (!storedRefreshToken) {
          throw new Error('No refresh token found in cookies');
        }
        // Attempt to get a new access token using stored refresh token
        const { access } = await authService.refreshToken({ refresh: storedRefreshToken });
        setAccessToken(access);
        // Fetch user profile
        const profile = await authService.getCurrentUser(access);
        setUser(profile);
        syncWithZustandStore(profile);
      } catch (error) {
        console.log('No active session or failed session restoration:', error);
        setUser(null);
        syncWithZustandStore(null);
        deleteCookie('refresh_token');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleAuthSuccess = (data: AuthResponse) => {
    setUser(data.user);
    setAccessToken(data.access);
    if (data.refresh) {
      setCookie('refresh_token', data.refresh, 7);
    }
    syncWithZustandStore(data.user);
  };

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    try {
      const response = await authService.login(payload);
      handleAuthSuccess(response);
    } finally {
      setLoading(false);
    }
  };

  const registerTenant = async (payload: RegisterTenantPayload) => {
    setLoading(true);
    try {
      await authService.registerTenant(payload);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Failed to logout from backend:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      syncWithZustandStore(null);
      deleteCookie('refresh_token');
    }
  };

  const createUser = async (payload: CreateUserPayload): Promise<UserProfile> => {
    if (!accessToken) {
      throw new Error('Unauthorized: Missing access token');
    }
    return await authService.createUser(payload, accessToken);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, registerTenant, logout, createUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
