"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { activeStoreStorage, storeApi } from "@/lib/api";
import type { Tenant } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

type StoreContextValue = {
  stores: Tenant[];
  activeStore: Tenant | null;
  isLoading: boolean;
  refreshStores: () => Promise<void>;
  selectStore: (storeId: string) => void;
  clearSelection: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  const [stores, setStores] = useState<Tenant[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true until auth + stores resolve

  const syncSelection = useCallback((nextStores: Tenant[]) => {
    const storedId = activeStoreStorage.get();

    if (storedId && nextStores.some((s) => s.id === storedId)) {
      setActiveStoreId(storedId);
      return;
    }

    if (nextStores.length === 1) {
      const onlyStoreId = nextStores[0].id;
      activeStoreStorage.set(onlyStoreId);
      setActiveStoreId(onlyStoreId);
      return;
    }

    activeStoreStorage.clear();
    setActiveStoreId(null);
  }, []);

  const refreshStores = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await storeApi.list();
      setStores(result.stores);
      syncSelection(result.stores);
    } catch {
      setStores([]);
      setActiveStoreId(null);
      activeStoreStorage.clear();
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, syncSelection]);

  useEffect(() => {
    if (authIsLoading) return; // wait for auth to settle before acting

    if (!isAuthenticated) {
      activeStoreStorage.clear();
      setStores([]);
      setActiveStoreId(null);
      setIsLoading(false);
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshStores();
  }, [isAuthenticated, authIsLoading, refreshStores, user?.id, user?.tenant_id]);

  const selectStore = useCallback(
    (storeId: string) => {
      if (!stores.some((s) => s.id === storeId)) return;
      activeStoreStorage.set(storeId);
      setActiveStoreId(storeId);
    },
    [stores]
  );

  const clearSelection = useCallback(() => {
    activeStoreStorage.clear();
    setActiveStoreId(null);
  }, []);

  const scopedStores = useMemo(
    () => (isAuthenticated ? stores : []),
    [isAuthenticated, stores]
  );

  const activeStore = useMemo(
    () => scopedStores.find((s) => s.id === activeStoreId) ?? null,
    [scopedStores, activeStoreId]
  );

  return (
    <StoreContext.Provider
      value={{
        stores: scopedStores,
        activeStore,
        isLoading,
        refreshStores,
        selectStore,
        clearSelection,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside <StoreProvider>");
  return context;
}
