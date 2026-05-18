"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrders } from "@/lib/orders/localOrders";

export default function CustomerAccountPage() {
  const { customer, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "addresses">("profile");
  const [orders, setOrders] = useState<ReturnType<typeof getOrders>>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${storeSlug}/login`);
    }
  }, [isAuthenticated, router, storeSlug]);

  useEffect(() => {
    setOrders(getOrders(storeSlug));
  }, [storeSlug, activeTab]);

  if (!isAuthenticated || !customer) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push(`/${storeSlug}`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="headline-md text-foreground">My Account</h1>
        <p className="mt-2 text-secondary">Welcome back, {customer.first_name}!</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="air-card h-fit rounded-[22px] p-6">
          <div className="mb-6 flex items-center gap-3 pb-6 border-b border-outline-variant/40">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
              {customer.first_name?.[0]?.toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{customer.first_name} {customer.last_name}</p>
              <p className="truncate text-xs text-secondary">{customer.email}</p>
            </div>
          </div>

          <nav className="mb-6 space-y-1">
            {["profile", "orders", "addresses"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`block w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-primary/10 text-primary"
                    : "text-secondary hover:bg-surface-container hover:text-foreground"
                }`}
              >
                {tab === "profile"
                  ? "Profile"
                  : tab === "orders"
                  ? "Orders"
                  : "Addresses"}
              </button>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="w-full rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
          >
            Logout
          </button>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="air-card rounded-[22px] p-8">
              <h2 className="mb-6 text-xl font-bold text-foreground">Profile Information</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-caps mb-1 block text-secondary">First Name</label>
                    <p className="rounded-xl bg-surface-container px-4 py-2.5 text-sm font-medium text-foreground">{customer.first_name}</p>
                  </div>
                  <div>
                    <label className="label-caps mb-1 block text-secondary">Last Name</label>
                    <p className="rounded-xl bg-surface-container px-4 py-2.5 text-sm font-medium text-foreground">{customer.last_name || "—"}</p>
                  </div>
                </div>

                <div>
                  <label className="label-caps mb-1 block text-secondary">Email Address</label>
                  <p className="rounded-xl bg-surface-container px-4 py-2.5 text-sm font-medium text-foreground">{customer.email}</p>
                </div>

                {customer.phone && (
                  <div>
                    <label className="label-caps mb-1 block text-secondary">Phone Number</label>
                    <p className="rounded-xl bg-surface-container px-4 py-2.5 text-sm font-medium text-foreground">{customer.phone}</p>
                  </div>
                )}

                <div className="pt-4">
                  <button className="btn-primary">Edit Profile</button>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="air-card rounded-[22px] p-8">
              <h2 className="mb-6 text-xl font-bold text-foreground">Order History</h2>

              {orders.length === 0 ? (
                <p className="text-secondary">You haven't placed any orders yet.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/${storeSlug}/orders/${order.id}`}
                      className="block rounded-xl border border-outline-variant/40 p-4 transition hover:border-primary/40 hover:bg-surface-container"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-secondary">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">${order.total.toFixed(2)}</p>
                          <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-surface-container-high text-secondary"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <div className="air-card rounded-[22px] p-8">
              <h2 className="mb-6 text-xl font-bold text-foreground">Saved Addresses</h2>

              <div className="space-y-4">
                <div className="rounded-xl border border-outline-variant/40 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Home</p>
                      <p className="mt-2 text-sm text-secondary leading-relaxed">
                        123 Main Street<br />
                        Anytown, ST 12345<br />
                        United States
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-full border border-outline-variant px-3 py-1 text-sm font-semibold text-secondary transition hover:bg-surface-container">
                        Edit
                      </button>
                      <button className="rounded-full border border-red-200 px-3 py-1 text-sm font-semibold text-red-500 transition hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button className="btn-primary">Add New Address</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
