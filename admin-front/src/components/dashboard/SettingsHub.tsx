"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export function SettingsHub() {
  const { activeStore } = useStore();

  if (!activeStore) {
    return (
      <Alert variant="warning">
        No active store selected. Go to <Link href="/dashboard/store/select" className="underline">store selection</Link> first.
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <p className="text-sm text-zinc-600">
          Manage the operational setup for <span className="font-medium text-zinc-900">{activeStore.name}</span>.
        </p>
      </Card>

      <Card padding="md">
        <div className="space-y-2">
          <Link href="/dashboard/store" className="block text-sm font-medium text-primary-600 hover:underline">
            Store identity and plan
          </Link>
          <p className="text-xs text-zinc-500">Edit store name, slug, and subscription plan.</p>
        </div>
      </Card>

      <Card padding="md">
        <div className="space-y-2">
          <Link href="/dashboard/payments" className="block text-sm font-medium text-primary-600 hover:underline">
            Payment gateway settings
          </Link>
          <p className="text-xs text-zinc-500">Connect Stripe, Razorpay, or PayPal for checkout.</p>
        </div>
      </Card>

      <Card padding="md">
        <div className="space-y-2">
          <Link href="/dashboard/security" className="block text-sm font-medium text-primary-600 hover:underline">
            Security settings
          </Link>
          <p className="text-xs text-zinc-500">Manage password and two-factor authentication.</p>
        </div>
      </Card>
    </div>
  );
}
