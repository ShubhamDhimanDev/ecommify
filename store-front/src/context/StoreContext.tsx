"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Store } from "@/lib/types/store";
import { storeApi } from "@/lib/api/client";

interface StoreContextType {
  store: Store | null;
  isLoading: boolean;
  error: string | null;
  fetchStore: (slug: string) => Promise<void>;
  clearStore: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStore = useCallback(async (slug: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await storeApi.getBySlug(slug);
      setStore(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch store";
      setError(message);
      console.error("Store fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearStore = useCallback(() => {
    setStore(null);
    setError(null);
  }, []);

  return (
    <StoreContext.Provider value={{ store, isLoading, error, fetchStore, clearStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
