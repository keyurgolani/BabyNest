"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, BabyResponseDto } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";

interface BabyContextType {
  baby: BabyResponseDto | null;
  babyId: string | null;
  loading: boolean;
  error: string | null;
  refreshBaby: () => Promise<void>;
  setBaby: (baby: BabyResponseDto | null) => void;
}

const BabyContext = createContext<BabyContextType | undefined>(undefined);

// Storage key for active baby ID
const ACTIVE_BABY_KEY = "babynest:activeBabyId";

export function BabyProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [baby, setBabyState] = useState<BabyResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBaby = useCallback(async () => {
    if (!isAuthenticated) {
      setBabyState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const babies = await api.babies.list();
      
      if (babies.data.length > 0) {
        // Check if we have a stored active baby ID
        const storedBabyId = typeof window !== "undefined" 
          ? localStorage.getItem(ACTIVE_BABY_KEY) 
          : null;
        
        // Find the stored baby or use the first one
        const activeBaby = storedBabyId 
          ? babies.data.find(b => b.id === storedBabyId) || babies.data[0]
          : babies.data[0];
        
        setBabyState(activeBaby);
        
        // Store the active baby ID
        if (typeof window !== "undefined") {
          localStorage.setItem(ACTIVE_BABY_KEY, activeBaby.id);
        }
      } else {
        setBabyState(null);
      }
    } catch (err) {
      console.error("Failed to fetch baby:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch baby");
      setBabyState(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      fetchBaby();
    }
  }, [authLoading, fetchBaby]);

  const setBaby = useCallback((newBaby: BabyResponseDto | null) => {
    setBabyState(newBaby);
    if (typeof window !== "undefined") {
      if (newBaby) {
        localStorage.setItem(ACTIVE_BABY_KEY, newBaby.id);
      } else {
        localStorage.removeItem(ACTIVE_BABY_KEY);
      }
    }
  }, []);

  const refreshBaby = useCallback(async () => {
    await fetchBaby();
  }, [fetchBaby]);

  return (
    <BabyContext.Provider
      value={{
        baby,
        babyId: baby?.id ?? null,
        loading: authLoading || loading,
        error,
        refreshBaby,
        setBaby,
      }}
    >
      {children}
    </BabyContext.Provider>
  );
}

export function useBaby() {
  const context = useContext(BabyContext);
  if (context === undefined) {
    throw new Error("useBaby must be used within a BabyProvider");
  }
  return context;
}

// Export the storage key for use in api-client
export { ACTIVE_BABY_KEY };
