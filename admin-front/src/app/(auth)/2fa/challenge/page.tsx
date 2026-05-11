"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { twoFactorApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { ShieldCheck } from "lucide-react";

function TwoFactorChallengeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = searchParams.get("token") ?? "";
      const res = await twoFactorApi.challenge(code, token);
      login(res.access_token, res.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Invalid code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
          <ShieldCheck className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">Two-factor authentication</h2>
        <p className="mt-1 text-sm text-zinc-500 max-w-xs">
          Enter the 6-digit code from your authenticator app or a recovery code.
        </p>
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Code"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(""); }}
          placeholder="123456"
          maxLength={32}
          autoFocus
          required
        />
        <Button type="submit" className="w-full" loading={loading} size="lg">
          Verify
        </Button>
      </form>
    </Card>
  );
}

export default function TwoFactorChallengePage() {
  return (
    <Suspense>
      <TwoFactorChallengeForm />
    </Suspense>
  );
}
