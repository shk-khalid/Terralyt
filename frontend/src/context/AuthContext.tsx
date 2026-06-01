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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

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
        // Attempt to get a new access token using credentials cookies
        const { access } = await authService.refreshToken({});
        setAccessToken(access);
        // Fetch user profile
        const profile = await authService.getCurrentUser(access);
        setUser(profile);
        syncWithZustandStore(profile);
      } catch (error) {
        console.log('No active session cookies or failed session restoration');
        setUser(null);
        syncWithZustandStore(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleAuthSuccess = (data: AuthResponse) => {
    setUser(data.user);
    setAccessToken(data.access);
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
