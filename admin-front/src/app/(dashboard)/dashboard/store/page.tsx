"use client";

import { useState } from "react";
import Link from "next/link";
import { storeApi } from "@/lib/api";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge, tenantStatusVariant } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";
import type { Tenant } from "@/lib/types";

const PLAN_OPTIONS = [
  { value: "", label: "No plan" },
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "enterprise", label: "Enterprise" },
];

export default function StorePage() {
  const { stores, activeStore: store, isLoading } = useStore();

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!store) {
    return (
      <Alert variant="warning">
        No active store selected. <Link href="/dashboard/store/select" className="font-medium underline">Select a store</Link> or{" "}
        <Link href="/dashboard/store/new" className="font-medium underline">create one</Link>.
      </Alert>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      {stores.length > 1 && (
        <div className="flex justify-end">
          <Link
            href="/dashboard/store/select"
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            Switch store
          </Link>
        </div>
      )}

      {/* Store identity banner */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-lg">
              {store.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-zinc-900">{store.name}</p>
                <Badge variant={tenantStatusVariant(store.status)}>{store.status}</Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Created {formatDate(store.created_at)} ·{" "}
                ID: <span className="font-mono">{store.id}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      <StoreSettingsForm key={store.id} store={store} />
    </div>
  );
}

function StoreSettingsForm({ store }: { store: Tenant }) {
  const [form, setForm] = useState({
    name: store.name,
    slug: store.slug,
    plan: store.plan ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess("");
    setSaving(true);
    try {
      const res = await storeApi.update({ ...form, plan: form.plan || undefined });
      setForm({ name: res.store.name, slug: res.store.slug, plan: res.store.plan ?? "" });
      setSaveSuccess("Store updated successfully.");
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: Record<string, string[]> };
      if (e.errors) {
        const flat: Record<string, string> = {};
        Object.entries(e.errors).forEach(([k, v]) => (flat[k] = v[0]));
        setErrors(flat);
      } else {
        setSaveError(e.message ?? "Failed to update store.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {saveError && <Alert variant="error">{saveError}</Alert>}
      {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}

      <Card>
        <CardHeader><CardTitle>Store settings</CardTitle></CardHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Store name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            error={errors.slug}
            hint="Used in your store URL. Lowercase letters, numbers and hyphens only."
            required
          />
          <Select
            label="Plan"
            value={form.plan}
            onChange={(e) => set("plan", e.target.value)}
            options={PLAN_OPTIONS}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Save changes</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
