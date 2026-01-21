"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { 
  ACCESS_TOKEN_KEY, 
  REFRESH_TOKEN_KEY, 
  TOKEN_EXPIRY_KEY, 
  LAST_ACTIVITY_KEY 
} from "@/lib/constants";

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (tokens: AuthTokens, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const PUBLIC_PATHS = ["/auth/login", "/auth/signup", "/auth/register", "/onboarding"];

// Idle timeout: 1 hour of inactivity before session expires
const IDLE_TIMEOUT_MS = 60 * 60 * 1000;

// Refresh token 5 minutes before expiry (increased buffer for reliability)
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + "/"));
}

function getStoredTokenExpiry(): number | null {
  if (typeof window === "undefined") return null;
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return expiry ? parseInt(expiry, 10) : null;
}

function getLastActivity(): number {
  if (typeof window === "undefined") return Date.now();
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  return lastActivity ? parseInt(lastActivity, 10) : Date.now();
}

function updateLastActivity(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

function isUserIdle(): boolean {
  const lastActivity = getLastActivity();
  return Date.now() - lastActivity > IDLE_TIMEOUT_MS;
}

function clearAuthTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

function storeAuthTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  // Store expiry time as timestamp
  const expiryTime = Date.now() + (tokens.expiresIn * 1000);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  updateLastActivity();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh the access token using the refresh token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    // Check if user has been idle too long
    if (isUserIdle()) {
      clearAuthTokens();
      return false;
    }

    try {
      const tokens = await api.auth.refresh(refreshToken);
      storeAuthTokens(tokens);
      return true;
    } catch {
      // Refresh failed, clear tokens
      clearAuthTokens();
      return false;
    }
  }, []);

  // Schedule the next token refresh
  const scheduleTokenRefresh = useCallback(() => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    const expiry = getStoredTokenExpiry();
    if (!expiry) return;

    const now = Date.now();
    const timeUntilExpiry = expiry - now;
    const refreshTime = Math.max(timeUntilExpiry - REFRESH_BUFFER_MS, 0);

    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(async () => {
        // Only refresh if user is not idle
        if (!isUserIdle()) {
          const success = await refreshAccessToken();
          if (success) {
            scheduleTokenRefresh();
          } else {
            setUser(null);
            if (!isPublicPath(pathname)) {
              router.push("/auth/login");
            }
          }
        } else {
          // User is idle, clear session
          clearAuthTokens();
          setUser(null);
          if (!isPublicPath(pathname)) {
            router.push("/auth/login");
          }
        }
      }, refreshTime);
    } else {
      // Token is already expired or about to expire, try to refresh now
      refreshAccessToken().then(success => {
        if (success) {
          scheduleTokenRefresh();
        }
      });
    }
  }, [refreshAccessToken, pathname, router]);

  // Track user activity
  useEffect(() => {
    if (typeof window === "undefined") return;

    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
    
    const handleActivity = () => {
      if (user) {
        updateLastActivity();
      }
    };

    // Throttle activity updates to avoid excessive writes
    let lastUpdate = 0;
    const throttledActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > 30000) { // Update at most once per 30 seconds
        lastUpdate = now;
        handleActivity();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, throttledActivity, { passive: true });
    });

    // Check for idle timeout periodically
    activityCheckRef.current = setInterval(() => {
      if (user && isUserIdle()) {
        clearAuthTokens();
        setUser(null);
        if (!isPublicPath(pathname)) {
          router.push("/auth/login");
        }
      }
    }, 60000); // Check every minute

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, throttledActivity);
      });
      if (activityCheckRef.current) {
        clearInterval(activityCheckRef.current);
      }
    };
  }, [user, pathname, router]);

  // Load user on mount
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        if (!isPublicPath(pathname)) {
          router.push("/auth/login");
        }
        setLoading(false);
        return;
      }

      // Check if user has been idle too long
      if (isUserIdle()) {
        clearAuthTokens();
        if (!isPublicPath(pathname)) {
          router.push("/auth/login");
        }
        setLoading(false);
        return;
      }

      // Check if token is expired and try to refresh
      const expiry = getStoredTokenExpiry();
      if (expiry && Date.now() >= expiry) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          if (!isPublicPath(pathname)) {
            router.push("/auth/login");
          }
          setLoading(false);
          return;
        }
      }

      try {
        const userData = await api.auth.me();
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          createdAt: userData.createdAt,
        });
        updateLastActivity();
        scheduleTokenRefresh();
      } catch (err) {
        if (err instanceof ApiError && err.isUnauthorized) {
          // Try to refresh the token
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            try {
              const userData = await api.auth.me();
              setUser({
                id: userData.id,
                email: userData.email,
                name: userData.name,
                createdAt: userData.createdAt,
              });
              updateLastActivity();
              scheduleTokenRefresh();
              setLoading(false);
              return;
            } catch {
              // Refresh succeeded but still can't get user
            }
          }
          clearAuthTokens();
          if (!isPublicPath(pathname)) {
            router.push("/auth/login");
          }
        } else {
          console.error("Failed to load user", err);
          clearAuthTokens();
          if (!isPublicPath(pathname)) {
            router.push("/auth/login");
          }
        }
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [pathname, router, refreshAccessToken, scheduleTokenRefresh]);

  const login = (tokens: AuthTokens, newUser: User) => {
    storeAuthTokens(tokens);
    setUser(newUser);
    scheduleTokenRefresh();
    router.push("/");
  };

  const logout = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    clearAuthTokens();
    setUser(null);
    router.push("/auth/login");
  };

  const refreshUser = async () => {
    try {
      const userData = await api.auth.me();
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        createdAt: userData.createdAt,
      });
    } catch (error) {
      console.error("Failed to refresh user", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
