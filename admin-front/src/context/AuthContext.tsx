"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi, tokenStorage } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start with isLoading:true so protected routes show a spinner instead of
  // flashing the login page while the stored token is being validated.
  // Both SSR and client start with the same initial value, so no hydration mismatch.
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const login = useCallback((token: string, user: User) => {
    tokenStorage.set(token);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort logout
    }
    tokenStorage.clear();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authApi.me();
      setState((prev) => ({ ...prev, user }));
    } catch {
      tokenStorage.clear();
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  // Hydrate from localStorage on mount (client-only — runs after hydration)
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      // No token — flip loading off so guards can render immediately
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }
    authApi
      .me()
      .then((user) => setState({ user, token, isLoading: false, isAuthenticated: true }))
      .catch(() => {
        tokenStorage.clear();
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
