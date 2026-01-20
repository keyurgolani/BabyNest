/**
 * Authentication store for managing user authentication state
 * Validates: Requirements 2.1, 2.2, 14.2
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  
  // Server configuration
  serverUrl: string | null;
  isServerConfigured: boolean;
}

interface AuthActions {
  // Auth actions
  setAuthenticated: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  
  // Server configuration actions
  setServerUrl: (url: string) => void;
  clearServerUrl: () => void;
  
  // Token management
  updateTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
  
  // Hydration check
  setHydrated: () => void;
}

export type AuthStore = AuthState & AuthActions & { _hasHydrated: boolean };

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: true,
      user: null,
      accessToken: null,
      refreshToken: null,
      serverUrl: null,
      isServerConfigured: false,
      _hasHydrated: false,

      // Auth actions
      setAuthenticated: (user, accessToken, refreshToken) =>
        set({
          isAuthenticated: true,
          isLoading: false,
          user,
          accessToken,
          refreshToken,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          accessToken: null,
          refreshToken: null,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      // Server configuration actions
      setServerUrl: (url) =>
        set({
          serverUrl: url,
          isServerConfigured: true,
        }),

      clearServerUrl: () =>
        set({
          serverUrl: null,
          isServerConfigured: false,
          // Also clear auth when server changes
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
        }),

      // Token management
      updateTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
        }),

      clearTokens: () =>
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          user: null,
        }),

      // Hydration check
      setHydrated: () => set({ _hasHydrated: true, isLoading: false }),
    }),
    {
      name: "babynest-auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        serverUrl: state.serverUrl,
        isServerConfigured: state.isServerConfigured,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

// Selector hooks for common use cases
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);

export const useAuthUser = () => useAuthStore((state) => state.user);

export const useServerConfig = () =>
  useAuthStore((state) => ({
    serverUrl: state.serverUrl,
    isServerConfigured: state.isServerConfigured,
  }));

export const useAuthLoading = () =>
  useAuthStore((state) => state.isLoading || !state._hasHydrated);
