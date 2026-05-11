"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store as StoreIcon, CheckCircle2, Plus } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, tenantStatusVariant } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

export default function SelectStorePage() {
  const router = useRouter();
  const { stores, activeStore, isLoading, selectStore } = useStore();

  const handleSelect = (storeId: string) => {
    selectStore(storeId);
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <Card padding="md">
        <p className="text-sm text-zinc-600">No stores found. Create one to continue.</p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/store/new")}>Create store</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Select a store</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Choose the store dashboard you want to work on.
          </p>
        </div>
        <Link
          href="/dashboard/store/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add new store
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stores.map((store) => {
          const isActive = activeStore?.id === store.id;
          return (
            <button
              key={store.id}
              onClick={() => handleSelect(store.id)}
              className="text-left"
            >
              <Card
                padding="md"
                className={`transition-all ${isActive ? "ring-2 ring-primary-500" : "hover:border-primary-300"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
                      <StoreIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900">{store.name}</p>
                      <p className="text-xs text-zinc-500">{store.slug}</p>
                    </div>
                  </div>
                  <Badge variant={tenantStatusVariant(store.status)}>{store.status}</Badge>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                  <span>{store.plan ? `Plan: ${store.plan}` : "No plan"}</span>
                  {isActive && (
                    <span className="inline-flex items-center gap-1 text-primary-600 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active
                    </span>
                  )}
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
