import React from "react";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Loader,
  ExternalLink,
} from "lucide-react";
import type { StorePaymentGateway, PaymentGateway } from "@/lib/types";

interface PaymentGatewayCardProps {
  gateway: PaymentGateway;
  config?: StorePaymentGateway;
  isLoading?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const gatewayDetails: Record<PaymentGateway, { name: string; description: string; color: string }> = {
  stripe: {
    name: "Stripe",
    description: "Accept payments worldwide with Stripe",
    color: "bg-blue-50 border-blue-200",
  },
  razorpay: {
    name: "Razorpay",
    description: "Accept payments in India with Razorpay",
    color: "bg-blue-50 border-blue-200",
  },
  paypal: {
    name: "PayPal",
    description: "Accept payments globally with PayPal",
    color: "bg-amber-50 border-amber-200",
  },
};

export function PaymentGatewayCard({
  gateway,
  config,
  isLoading,
  onConnect,
  onDisconnect,
}: PaymentGatewayCardProps) {
  const details = gatewayDetails[gateway];
  const isConnected = config?.is_active;

  return (
    <div className={`rounded-lg border p-6 ${details.color}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-white p-3">
            <CreditCard className="h-6 w-6 text-zinc-700" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">{details.name}</h3>
            <p className="text-sm text-zinc-600">{details.description}</p>
            {isConnected && config?.connected_at && (
              <p className="mt-1 text-xs text-zinc-500">
                Connected on {new Date(config.connected_at).toLocaleDateString()}
              </p>
            )}
            {config?.gateway_account_id && (
              <p className="mt-1 text-xs font-mono text-zinc-600">
                {config.gateway_account_id}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-zinc-400" />
              <span className="text-sm text-zinc-500">Not connected</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {isConnected ? (
          <>
            <button
              onClick={onDisconnect}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 inline h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </button>
          </>
        ) : (
          <button
            onClick={onConnect}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 inline h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Connect <ExternalLink className="ml-2 inline h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
