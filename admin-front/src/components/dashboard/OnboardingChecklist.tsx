"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { orderApi, paymentGatewayApi, productApi } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

type ProgressState = {
  products: number;
  orders: number;
  hasGateway: boolean;
};

export function OnboardingChecklist() {
  const { activeStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState>({ products: 0, orders: 0, hasGateway: false });

  useEffect(() => {
    async function load() {
      if (!activeStore) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [productsRes, ordersRes, gatewaysRes] = await Promise.all([
          productApi.list(activeStore.slug, { q: "" }),
          orderApi.list(activeStore.slug),
          paymentGatewayApi.list(activeStore.slug),
        ]);

        setProgress({
          products: productsRes.total ?? 0,
          orders: ordersRes.total ?? 0,
          hasGateway: (gatewaysRes.data ?? []).some((g) => g.is_active),
        });
      } catch {
        setError("Could not load onboarding progress.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [activeStore]);

  const steps = useMemo(() => {
    return [
      {
        title: "Create your first product",
        done: progress.products > 0,
        href: "/dashboard/products/new",
        cta: "Add Product",
      },
      {
        title: "Connect a payment gateway",
        done: progress.hasGateway,
        href: "/dashboard/payments",
        cta: "Connect Payments",
      },
      {
        title: "Receive your first order",
        done: progress.orders > 0,
        href: "/dashboard/orders",
        cta: "View Orders",
      },
    ];
  }, [progress]);

  if (!activeStore) {
    return (
      <Alert variant="warning">
        Select or create a store first from <Link href="/dashboard/store/select" className="underline">store selection</Link>.
      </Alert>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const completed = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Store onboarding</CardTitle>
        </CardHeader>
        <div className="space-y-2 text-sm text-zinc-600">
          <p>
            Progress: <span className="font-semibold text-zinc-900">{completed}/{steps.length}</span> steps complete
          </p>
          <p>Store: <span className="font-medium text-zinc-900">{activeStore.name}</span></p>
        </div>
      </Card>

      <div className="space-y-3">
        {steps.map((step) => (
          <Card key={step.title} padding="md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${step.done ? "bg-emerald-500" : "bg-zinc-300"}`} />
                <p className="text-sm font-medium text-zinc-900">{step.title}</p>
              </div>
              <Link href={step.href} className="text-sm font-medium text-primary-600 hover:underline">
                {step.done ? "Review" : step.cta}
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
