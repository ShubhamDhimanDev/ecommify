"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { PaymentGatewayCard } from "@/components/ui/PaymentGatewayCard";
import { usePaymentGateways } from "@/hooks/usePaymentGateways";
import type { PaymentGateway } from "@/lib/types";

export function PaymentGatewayManager() {
  const params = useParams();
  const slug = params?.slug as string;

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { gateways, operatingOn, error, initiateConnection, disconnect } =
    usePaymentGateways({
      slug,
      onError: (error) => {
        setNotification({
          type: "error",
          message: error.message,
        });
      },
      onSuccess: (message) => {
        setNotification({
          type: "success",
          message,
        });
      },
    });

  const availableGateways: PaymentGateway[] = ["stripe", "razorpay", "paypal"];

  const getGatewayConfig = (gateway: PaymentGateway) => {
    return gateways.find((g) => g.gateway === gateway);
  };

  const handleConnect = (gateway: PaymentGateway) => {
    setNotification(null);
    initiateConnection(gateway);
  };

  const handleDisconnect = (gateway: PaymentGateway) => {
    setNotification(null);
    if (confirm(`Are you sure you want to disconnect ${gateway}?`)) {
      disconnect(gateway);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Notification */}
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Error</h3>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {notification?.type === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      {/* Error Notification */}
      {notification?.type === "error" && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Payment Gateways</h2>
        <p className="mt-1 text-zinc-600">
          Connect your payment gateway accounts to start receiving payments from customers.
        </p>
      </div>

      {/* Gateway Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableGateways.map((gateway) => (
          <PaymentGatewayCard
            key={gateway}
            gateway={gateway}
            config={getGatewayConfig(gateway)}
            isLoading={operatingOn === gateway}
            onConnect={() => handleConnect(gateway)}
            onDisconnect={() => handleDisconnect(gateway)}
          />
        ))}
      </div>

      {/* Info Section */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="font-semibold text-blue-900">How it works</h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>• Click "Connect" on any payment gateway to authorize your account</li>
          <li>• You'll be redirected to the payment provider to complete authorization</li>
          <li>• Your connection will be securely stored for processing payments</li>
          <li>• Customers can pay using the connected gateways</li>
        </ul>
      </div>
    </div>
  );
}
