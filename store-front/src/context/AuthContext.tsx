"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { CustomerSession } from "@/lib/types/customer";
import { customerApi } from "@/lib/api/client";

interface AuthContextType {
  customer: CustomerSession | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; first_name: string; last_name?: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const customerData = localStorage.getItem("customer");

    if (token && customerData) {
      try {
        setCustomer(JSON.parse(customerData));
      } catch (error) {
        console.error("Failed to parse customer data:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("customer");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await customerApi.login(email, password);
      const data = response as any;
      
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("customer", JSON.stringify(data));
      setCustomer(data);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; first_name: string; last_name?: string }) => {
    setIsLoading(true);
    try {
      const response = await customerApi.register(data);
      const result = response as any;
      
      localStorage.setItem("auth_token", result.token);
      localStorage.setItem("customer", JSON.stringify(result));
      setCustomer(result);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
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
