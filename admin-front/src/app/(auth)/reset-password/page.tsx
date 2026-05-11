"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [form, setForm] = useState({
    email: params.get("email") ?? "",
    password: "",
    password_confirmation: "",
    token: params.get("token") ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    setLoading(true);
    try {
      await authApi.resetPassword(form);
      router.push("/login?reset=1");
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: Record<string, string[]> };
      if (e.errors) {
        const flat: Record<string, string> = {};
        Object.entries(e.errors).forEach(([k, v]) => (flat[k] = v[0]));
        setErrors(flat);
      } else {
        setApiError(e.message ?? "Reset failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900">Set new password</h2>
        <p className="mt-1 text-sm text-zinc-500">Enter your new password below.</p>
      </div>

      {apiError && <Alert variant="error" className="mb-4">{apiError}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
          required
        />
        <Input
          label="New password"
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          error={errors.password}
          placeholder="Min 8 characters"
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          value={form.password_confirmation}
          onChange={(e) => set("password_confirmation", e.target.value)}
          error={errors.password_confirmation}
          required
        />
        <Button type="submit" className="w-full" loading={loading} size="lg">
          Reset password
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-500">
        <Link href="/login" className="text-primary-600 hover:underline font-medium">
          Back to login
        </Link>
      </p>
    </Card>
  );
}
