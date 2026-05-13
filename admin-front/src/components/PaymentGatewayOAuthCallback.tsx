"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Loader } from "lucide-react";
import { usePaymentGateways } from "@/hooks/usePaymentGateways";

export function PaymentGatewayOAuthCallback() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = params?.slug as string;

  const { handleOAuthCallback } = usePaymentGateways({
    onError: (error) => {
      setError(error.message);
      setIsProcessing(false);
    },
    onSuccess: () => {
      // Redirect back to payments page after successful connection
      setTimeout(() => {
        router.push(`/${slug}/payments`);
      }, 2000);
    },
  });

  useEffect(() => {
    const gateway = searchParams.get("gateway") as any;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorCode = searchParams.get("error");

    if (errorCode) {
      setError(`OAuth error: ${errorCode}`);
      setIsProcessing(false);
      return;
    }

    if (!gateway || !code) {
      setError("Missing required parameters from OAuth provider");
      setIsProcessing(false);
      return;
    }

    // Process the OAuth callback
    handleOAuthCallback(gateway, code);
  }, [searchParams, handleOAuthCallback]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900">Connection Failed</h1>
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={() => router.push(`/${slug}/payments`)}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Back to Payments
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">Processing Connection</h1>
          <p className="mt-2 text-zinc-600">Please wait while we complete your payment gateway connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="rounded-lg border border-green-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Connection Successful!</h1>
        <p className="mt-2 text-green-600">Your payment gateway has been connected successfully.</p>
        <p className="mt-1 text-sm text-zinc-600">Redirecting you back...</p>
      </div>
    </div>
  );
}
