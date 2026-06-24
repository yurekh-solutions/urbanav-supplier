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
  login: (email: string, password: string) => Promise<{ justApproved?: boolean } | void>;
  register: (data: any) => Promise<{ pending?: boolean; user?: any } | void>;
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
      let user: any;
      let token: string;
      let justApproved = false;
      const res = await authAPI.login({ email, password });
      const d: any = res.data || {};
      user = d.user ?? d;
      token = d.token ?? d.accessToken;
      justApproved = !!d.justApproved;

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

      // Return justApproved so LoginScreen can trigger the approval popup
      return { justApproved };
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
      const res = await authAPI.register(payload);
      const d: any = res.data || {};
      const user = d.user ?? d;
      const token = d.token ?? d.accessToken;

      // If the server returned a pending status, don't auto-login.
      // Supplier must wait for admin approval before logging in.
      const accountStatus = user?.accountStatus;
      const kycStatus = user?.kycStatus;

      if (accountStatus === 'pending' || kycStatus === 'pending') {
        // Don't set auth state — store minimal info so we know the account exists
        // but don't set onboarded or authenticated flags.
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
          hasOnboarded: false, // Keep false so PendingApproval screen shows
        });
        // Return success info instead of throwing — let RegisterScreen handle navigation
        return { pending: true, user };
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
      const [userStr, token, authenticated, onboarded, pendingStr] = await AsyncStorage.multiGet([
        '@urbanav_user',
        '@urbanav_token',
        '@urbanav_authenticated',
        '@urbanav_onboarded',
        '@urbanav_pending',
      ]);

      const isPending = pendingStr[1] === 'true';
      const hasOnboarded = onboarded[1] === 'true' || isPending; // Pending users have "onboarded" (filled registration)

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
        // If pending, still set hasOnboarded so we skip Onboarding
        // but keep isAuthenticated: false so they can't access main tabs
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
