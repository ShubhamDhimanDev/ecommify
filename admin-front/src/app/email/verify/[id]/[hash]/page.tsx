"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function EmailVerifyContent() {
  const params = useParams<{ id: string; hash: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Wait until auth state is resolved
    if (authLoading) return;

    const expires = searchParams.get("expires") ?? "";
    const signature = searchParams.get("signature") ?? "";

    if (!expires || !signature) {
      setStatus("error");
      setMessage("Invalid verification link. Please request a new one.");
      return;
    }

    if (!isAuthenticated) {
      // Not logged in — redirect to login, then come back here after
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.replace(`/login?redirect=${returnUrl}`);
      return;
    }

    setStatus("loading");
    authApi
      .verifyEmail(params.id, params.hash, expires, signature)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err: unknown) => {
        const e = err as { message?: string };
        setStatus("error");
        setMessage(e.message ?? "Email verification failed.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-sm p-8 text-center">
        <div className="mb-4 text-xl font-bold text-zinc-900">Email Verification</div>

        {(status === "idle" || status === "loading" || authLoading) && (
          <div className="flex flex-col items-center gap-3 text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <p className="text-sm">Verifying your email address…</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <p className="text-sm text-zinc-700">{message}</p>
            <Button className="mt-2" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="h-10 w-10 text-red-500" />
            <Alert variant="error">{message}</Alert>
            <Button variant="outline" className="mt-2" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmailVerifyPage() {
  return (
    <Suspense>
      <EmailVerifyContent />
    </Suspense>
  );
}
