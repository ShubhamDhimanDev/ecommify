"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { storeApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Select } from "@/components/ui/Select";

const PLAN_OPTIONS = [
  { value: "", label: "No plan (free)" },
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "enterprise", label: "Enterprise" },
];

export default function CreateStorePage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [form, setForm] = useState({ name: "", slug: "", plan: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => {
    setErrors((p) => ({ ...p, [k]: "" }));

    if (k === "name") {
      // Auto-generate slug from name
      setForm((p) => ({
        ...p,
        name: v,
        slug: v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      }));
    } else {
      setForm((p) => ({ ...p, [k]: v }));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    setLoading(true);
    try {
      await storeApi.create({ name: form.name, slug: form.slug, plan: form.plan || undefined });
      // Refresh user so tenant_id is now populated in context
      await refreshUser();
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: Record<string, string[]> };
      if (e.errors) {
        const flat: Record<string, string> = {};
        Object.entries(e.errors).forEach(([k, v]) => (flat[k] = v[0]));
        setErrors(flat);
      } else {
        setApiError(e.message ?? "Failed to create store.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-start justify-center pt-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 mb-3">
            <Store className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Create your store</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Set up your store to start selling. You can change these details later.
          </p>
        </div>

        {apiError && <Alert variant="error">{apiError}</Alert>}

        <Card>
          <CardHeader><CardTitle>Store details</CardTitle></CardHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Store name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              error={errors.name}
              placeholder="My Awesome Shop"
              autoFocus
              required
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              error={errors.slug}
              placeholder="my-awesome-shop"
              hint="Unique identifier for your store URL. Lowercase, no spaces."
              required
            />
            <Select
              label="Plan"
              value={form.plan}
              onChange={(e) => set("plan", e.target.value)}
              options={PLAN_OPTIONS}
            />
            <Button type="submit" className="w-full" loading={loading} size="lg">
              Create store
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
