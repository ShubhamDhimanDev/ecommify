import { useState, useEffect, useCallback } from "react";
import { paymentGatewayApi } from "@/lib/api";
import type { StorePaymentGateway, PaymentGateway } from "@/lib/types";

interface UsePaymentGatewayOptions {
  slug: string; // Store slug for API requests
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

export function usePaymentGateways(options: UsePaymentGatewayOptions) {
  const [gateways, setGateways] = useState<StorePaymentGateway[]>([]);
  const [loading, setLoading] = useState(false);
  const [operatingOn, setOperatingOn] = useState<PaymentGateway | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Fetch list of connected gateways
  const fetchGateways = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentGatewayApi.list(options.slug);
      setGateways(response.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch gateways");
      setError(error);
      options?.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [options.slug]);

  // Get a specific gateway config
  const getGateway = useCallback(
    async (gatewayName: PaymentGateway) => {
      try {
        const response = await paymentGatewayApi.detail(options.slug, gatewayName);
        return response.gateway;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to fetch gateway");
        setError(error);
        options?.onError?.(error);
        return null;
      }
    },
    [options.slug]
  );

  // Initiate OAuth connection flow
  const initiateConnection = useCallback(
    async (gatewayName: PaymentGateway) => {
      try {
        setOperatingOn(gatewayName);
        setError(null);
        const response = await paymentGatewayApi.initiateConnection(options.slug, gatewayName);
        
        // Redirect to OAuth provider
        if (response.authorization_url) {
          window.location.href = response.authorization_url;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to initiate connection");
        setError(error);
        setOperatingOn(null);
        options?.onError?.(error);
      }
    },
    [options.slug]
  );

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(
    async (gatewayName: PaymentGateway, code: string) => {
      try {
        setOperatingOn(gatewayName);
        setError(null);
        const response = await paymentGatewayApi.handleCallback(options.slug, gatewayName, code);
        
        // Update gateways list
        setGateways((prev) => {
          const index = prev.findIndex((g) => g.gateway === gatewayName);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = response.gateway;
            return updated;
          }
          return [...prev, response.gateway];
        });

        options?.onSuccess?.(response.message);
        setOperatingOn(null);
        return response.gateway;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to complete OAuth");
        setError(error);
        setOperatingOn(null);
        options?.onError?.(error);
        return null;
      }
    },
    [options.slug]
  );

  // Disconnect a gateway
  const disconnect = useCallback(
    async (gatewayName: PaymentGateway) => {
      try {
        setOperatingOn(gatewayName);
        setError(null);
        const response = await paymentGatewayApi.disconnect(options.slug, gatewayName);
        
        // Update gateways list
        setGateways((prev) =>
          prev.filter((g) => g.gateway !== gatewayName)
        );

        options?.onSuccess?.(response.message);
        setOperatingOn(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to disconnect");
        setError(error);
        setOperatingOn(null);
        options?.onError?.(error);
      }
    },
    [options.slug]
  );

  // Test gateway connection
  const testConnection = useCallback(
    async (gatewayName: PaymentGateway) => {
      try {
        setOperatingOn(gatewayName);
        setError(null);
        const response = await paymentGatewayApi.test(options.slug, gatewayName);
        
        options?.onSuccess?.(response.message);
        return response.success;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to test connection");
        setError(error);
        options?.onError?.(error);
        return false;
      } finally {
        setOperatingOn(null);
      }
    },
    [options.slug]
  );

  // Fetch gateways on mount
  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  return {
    gateways,
    loading,
    operatingOn,
    error,
    fetchGateways,
    getGateway,
    initiateConnection,
    handleOAuthCallback,
    disconnect,
    testConnection,
  };
}
