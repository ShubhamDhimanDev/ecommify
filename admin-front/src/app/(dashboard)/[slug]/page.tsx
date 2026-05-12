"use client";

import { Store, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge, tenantStatusVariant } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function SlugDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { activeStore: store, stores, isLoading } = useStore();

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">
          Welcome back, {user?.name?.split(" ")[0]}
        </h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          {store
            ? `Here is an overview of ${store.name}.`
            : stores.length > 1
              ? "Select a store to view its dashboard."
              : "Get started by creating your first store."}
        </p>
      </div>

      {store ? (
        <>
          {/* Store status banner */}
          <Card padding="md">
            <div className="flex items-center justify-between flex-wrap gap-4">
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
                    slug: <span className="font-mono">{store.slug}</span>
                    {store.plan && <> &middot; plan: <span className="capitalize">{store.plan}</span></>}
                    {" \u00b7 "}created {formatDate(store.created_at)}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/store"
                className="text-sm font-medium text-primary-600 hover:underline"
              >
                Manage store &rarr;
              </Link>
            </div>
          </Card>

          {/* Quick stats placeholders */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Orders", value: "--" },
              { label: "Revenue", value: "--" },
              { label: "Customers", value: "--" },
              { label: "Products", value: "--" },
            ].map(({ label, value }) => (
              <Card key={label} padding="md">
                <p className="text-xs font-medium text-zinc-500">{label}</p>
                <p className="mt-1.5 text-2xl font-bold text-zinc-400">{value}</p>
                <p className="text-xs text-zinc-400 mt-0.5">Coming soon</p>
              </Card>
            ))}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Products", href: `/${slug}/products` },
              { label: "Categories", href: `/${slug}/categories` },
              { label: "Orders", href: `/${slug}/orders` },
              { label: "Customers", href: `/${slug}/customers` },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:border-primary-300 hover:text-primary-600 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Checklist */}
          <Card>
            <p className="text-sm font-semibold text-zinc-900 mb-4">Getting started</p>
            <div className="space-y-2.5">
              {[
                { label: "Create your store", done: stores.length > 0 },
                { label: "Verify your email", done: !!user?.email_verified_at },
                { label: "Enable two-factor authentication", done: !!user?.two_factor_enabled },
                { label: "Add your first product", done: false },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2.5">
                  {done
                    ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    : <AlertCircle className="h-4 w-4 text-zinc-300 shrink-0" />
                  }
                  <span className={`text-sm ${done ? "text-zinc-500 line-through" : "text-zinc-700"}`}>{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : stores.length > 1 ? (
        <Card padding="md">
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
              <Store className="h-7 w-7 text-primary-600" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900">Select a store</h3>
            <p className="mt-1 text-sm text-zinc-500 max-w-xs">
              You have multiple stores. Choose one to open its dashboard.
            </p>
            <Link
              href="/dashboard/store/select"
              className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              Choose store
            </Link>
          </div>
        </Card>
      ) : (
        <Card padding="md">
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
              <Store className="h-7 w-7 text-primary-600" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900">No store yet</h3>
            <p className="mt-1 text-sm text-zinc-500 max-w-xs">
              Create your first store to start selling.
            </p>
            <Link
              href="/dashboard/store/new"
              className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              Create store
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
