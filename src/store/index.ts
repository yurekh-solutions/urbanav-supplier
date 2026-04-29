import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';

interface AuthState {
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasOnboarded: boolean;
  // Compatibility fields so screens copied from the buyer app work unchanged.
  // In the supplier app there is no guest mode and the role is always 'supplier'.
  isGuest: boolean;
  preferredRole: 'supplier';
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  requireAuth: () => boolean;
  refreshUser: () => Promise<any | null>;
  updateProfile: (data: any) => Promise<any>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  hasOnboarded: false,
  isGuest: false,
  preferredRole: 'supplier',

  continueAsGuest: async () => {
    // Guest mode is not supported in the supplier app. No-op.
  },

  requireAuth: () => {
    return get().isAuthenticated;
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // Call backend; demo credentials are handled server-side via .env.
      let user: any;
      let token: string;
      try {
        const res = await authAPI.login({ email, password });
        const d: any = res.data || {};
        user = d.user ?? d;
        token = d.token ?? d.accessToken ?? 'mock-token';
      } catch (apiErr: any) {
        // Offline fallback is removed — let the server return the error.
        throw apiErr;
      }

      // Guard: only supplier accounts may sign in here.
      const userType = user?.userType || user?.role;
      if (userType && userType !== 'supplier') {
        set({ isLoading: false });
        const err: any = new Error('This is a buyer account. Please use the UrbanAV buyer app.');
        err.response = { data: { message: 'This is a buyer account. Use the UrbanAV buyer app.' } };
        throw err;
      }

      await AsyncStorage.multiSet([
        ['@urbanav_user', JSON.stringify(user)],
        ['@urbanav_token', token],
        ['@urbanav_authenticated', 'true'],
        ['@urbanav_onboarded', 'true'],
      ]);

      set({ user, token, isAuthenticated: true, hasOnboarded: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true });
    // Force supplier role for this app (urbanav-supplier).
    const payload = { ...data, role: 'supplier', userType: 'supplier' };
    try {
      let user: any;
      let token: string;
      try {
        const res = await authAPI.register(payload);
        const d: any = res.data || {};
        user = d.user ?? d;
        token = d.token ?? d.accessToken ?? 'mock-token';
      } catch (apiErr: any) {
        // API failed — surface the real error to LoginScreen
        throw apiErr;
      }

      // If the server returned a pending status, don't auto-login.
      // Supplier must wait for admin approval before logging in.
      const accountStatus = user?.accountStatus;
      const kycStatus = user?.kycStatus;

      if (accountStatus === 'pending' || kycStatus === 'pending') {
        // Don't set auth state — go back to login with pending status shown.
        await AsyncStorage.multiSet([
          ['@urbanav_user', JSON.stringify(user)],
          ['@urbanav_token', token],
          ['@urbanav_pending', 'true'],
        ]);
        set({
          user,
          token,
          isLoading: false,
          isAuthenticated: false,
          hasOnboarded: false,
        });
        const err: any = new Error('pending_approval');
        err.response = { data: { message: 'pending_approval' } };
        throw err;
      }

      // Active account — proceed with login as normal
      await AsyncStorage.multiSet([
        ['@urbanav_user', JSON.stringify(user)],
        ['@urbanav_token', token],
        ['@urbanav_authenticated', 'true'],
        ['@urbanav_onboarded', 'true'],
      ]);

      set({ user, token, isAuthenticated: true, hasOnboarded: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove([
      '@urbanav_user',
      '@urbanav_token',
      '@urbanav_authenticated',
    ]);
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const [userStr, token, authenticated, onboarded] = await AsyncStorage.multiGet([
        '@urbanav_user',
        '@urbanav_token',
        '@urbanav_authenticated',
        '@urbanav_onboarded',
      ]);

      const hasOnboarded = onboarded[1] === 'true';

      if (authenticated[1] === 'true' && token[1] && userStr[1]) {
        const user = JSON.parse(userStr[1]);
        set({
          user,
          token: token[1],
          isAuthenticated: true,
          hasOnboarded: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false, hasOnboarded });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({ isLoading: false });
    }
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem('@urbanav_onboarded', 'true');
    set({ hasOnboarded: true });
  },

  refreshUser: async () => {
    const { isAuthenticated, user: prev } = get();
    if (!isAuthenticated) return null;
    try {
      const res = await authAPI.getMe();
      const d: any = res.data || {};
      const fresh = d.user ?? d;
      if (!fresh || typeof fresh !== 'object') return prev;
      const merged = { ...(prev || {}), ...fresh };
      await AsyncStorage.setItem('@urbanav_user', JSON.stringify(merged));
      set({ user: merged });
      return merged;
    } catch {
      return prev;
    }
  },

  updateProfile: async (data: any) => {
    const { user: prev } = get();
    let updated = { ...(prev || {}), ...data };
    try {
      const res = await authAPI.updateProfile(data);
      const d: any = res.data || {};
      const fresh = d.user ?? d;
      if (fresh && typeof fresh === 'object') updated = { ...updated, ...fresh };
    } catch {
      // Offline: persist locally so the UI reflects the edit.
    }
    await AsyncStorage.setItem('@urbanav_user', JSON.stringify(updated));
    set({ user: updated });
    return updated;
  },
}));
