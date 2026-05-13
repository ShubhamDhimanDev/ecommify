"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { CustomerSession } from "@/lib/types/customer";
import { customerApi } from "@/lib/api/client";

interface AuthContextType {
  customer: CustomerSession | null;
  isLoading: boolean;
  login: (storeSlug: string, email: string, password: string) => Promise<void>;
  register: (storeSlug: string, data: { email: string; password: string; first_name: string; last_name?: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const customerData = localStorage.getItem("customer");

    if (customerData) {
      try {
        setCustomer(JSON.parse(customerData));
      } catch (error) {
        console.error("Failed to parse customer data:", error);
        localStorage.removeItem("customer");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (storeSlug: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await customerApi.login(storeSlug, email, password);
      const data = response as any;
      // API returns { customer, store } — no token
      const customerData = data.customer ?? data;
      localStorage.setItem("customer", JSON.stringify(customerData));
      setCustomer(customerData);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (storeSlug: string, data: { email: string; password: string; first_name: string; last_name?: string }) => {
    setIsLoading(true);
    try {
      const response = await customerApi.register(storeSlug, data);
      const result = response as any;
      // API returns { customer } on register
      const customerData = result.customer ?? result;
      localStorage.setItem("customer", JSON.stringify(customerData));
      setCustomer(customerData);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("customer");
    setCustomer(null);
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!customer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
