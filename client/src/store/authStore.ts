import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, Academy, AcademyRole, PlatformRole } from '@/types';
import { authApi } from '@/lib/api/auth';
import { queryClient } from '@/lib/queryClient';

interface AuthState {
  user: Profile | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  activeAcademy: Academy | null;
  academyRole: AcademyRole | null;
  platformRole: PlatformRole | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  selectAcademy: (academy: Academy, role: AcademyRole) => Promise<void>;
  setUser: (user: Profile) => void;
  setActiveAcademy: (academy: Academy, role: AcademyRole) => void;
  loadMe: () => Promise<void>;
}

const PERMISSION_MAP: Record<AcademyRole | 'super_admin', string[]> = {
  super_admin: ['*'],
  academy_owner: ['*'],
  academy_admin: [
    'academy.read', 'academy.update', 'membership.read', 'membership.create',
    'membership.update', 'athlete.read', 'athlete.create', 'athlete.update',
    'category.read', 'category.manage', 'training.read', 'training.manage',
    'attendance.read', 'attendance.manage', 'payment_period.read', 'payment_period.generate',
    'payment_report.create', 'payment_report.review', 'payment_report.confirm',
    'payment_report.reject', 'expense.read', 'expense.create', 'expense.update',
    'income.read', 'income.create', 'income.update', 'finance.read',
    'tournament.read', 'tournament.create', 'tournament.update',
    'tournament.callup.manage', 'notification.send',
  ],
  finance_manager: [
    'academy.read', 'athlete.read', 'category.read', 'payment_period.read',
    'payment_period.generate', 'payment_report.review', 'payment_report.confirm',
    'payment_report.reject', 'expense.read', 'expense.create', 'expense.update',
    'income.read', 'income.create', 'income.update', 'finance.read', 'finance.export',
    'notification.send',
  ],
  collections_manager: [
    'academy.read', 'athlete.read', 'category.read', 'payment_period.read',
    'payment_period.generate', 'payment_report.review', 'payment_report.confirm',
    'payment_report.reject', 'finance.read', 'notification.send',
  ],
  coach: [
    'academy.read', 'athlete.read', 'category.read', 'training.read', 'training.manage',
    'attendance.read', 'attendance.manage', 'tournament.read', 'tournament.create',
    'tournament.update', 'tournament.callup.manage',
  ],
  staff: [
    'academy.read', 'athlete.read', 'category.read', 'training.read',
    'attendance.read', 'attendance.manage', 'tournament.read',
  ],
  guardian: ['academy.read', 'athlete.read', 'payment_period.read', 'payment_report.create', 'training.read', 'tournament.read'],
  athlete: ['academy.read', 'payment_period.read', 'payment_report.create', 'training.read', 'tournament.read'],
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      activeAcademy: null,
      academyRole: null,
      platformRole: null,
      permissions: [],
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login({ email, password });
          const platformRole = res.profile.profile_platform_roles?.[0]?.platform_roles?.code as PlatformRole | null;
          set({
            user: res.profile,
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
            expiresAt: res.expires_at,
            platformRole: platformRole || null,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        queryClient.clear();
        // Clear localStorage to remove stale tokens
        localStorage.removeItem('club-auth');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          activeAcademy: null,
          academyRole: null,
          platformRole: null,
          permissions: [],
          isAuthenticated: false,
        });
      },

      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          // No refresh token available, force logout
          get().logout();
          throw new Error('No refresh token');
        }
        try {
          const res = await authApi.refresh(refreshToken);
          set({
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
            expiresAt: res.expires_at,
          });
        } catch (error) {
          // Refresh failed - clear tokens and force logout
          console.error('Token refresh failed:', error);
          get().logout();
          throw error;
        }
      },

      selectAcademy: async (academy, role) => {
        await authApi.selectAcademy(academy.id);
        queryClient.clear();
        const permissions = PERMISSION_MAP[role] || [];
        set({ activeAcademy: academy, academyRole: role, permissions });
      },

      setActiveAcademy: (academy, role) => {
        const permissions = PERMISSION_MAP[role] || [];
        set({ activeAcademy: academy, academyRole: role, permissions });
      },

      setUser: (user) => set({ user }),

      loadMe: async () => {
        try {
          const profile = await authApi.me();
          const platformRole = profile.profile_platform_roles?.[0]?.platform_roles?.code as PlatformRole | null;
          set({ user: profile, platformRole: platformRole || null });
        } catch {
          // silent
        }
      },
    }),
    {
      name: 'club-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        user: state.user,
        activeAcademy: state.activeAcademy,
        academyRole: state.academyRole,
        platformRole: state.platformRole,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
