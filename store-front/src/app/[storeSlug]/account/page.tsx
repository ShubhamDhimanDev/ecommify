"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CustomerAccountPage() {
  const { customer, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "addresses">("profile");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${storeSlug}/login`);
    }
  }, [isAuthenticated, router, storeSlug]);

  if (!isAuthenticated || !customer) {
    return null;
  }

  const orders = [
    {
      id: "ORD-001",
      date: "2024-01-15",
      total: "$252.97",
      status: "Delivered",
      items: 3,
    },
    {
      id: "ORD-002",
      date: "2024-01-20",
      total: "$89.99",
      status: "In Transit",
      items: 1,
    },
  ];

  const handleLogout = () => {
    logout();
    router.push(`/${storeSlug}`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">My Account</h1>
        <p className="text-gray-600 mt-2">Welcome back, {customer.first_name}!</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 h-fit">
          <div className="mb-6 pb-6 border-b">
            <p className="text-sm text-gray-600 mb-1">Logged in as</p>
            <p className="font-semibold text-gray-900">{customer.email}</p>
          </div>

          <nav className="space-y-2 mb-6">
            {["profile", "orders", "addresses"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`block w-full text-left px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === tab
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
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
            className="w-full rounded-lg border border-red-300 px-4 py-2 font-medium text-red-600 hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="rounded-lg border border-gray-200 bg-white p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <p className="px-4 py-2 rounded-lg bg-gray-50 text-gray-900">{customer.first_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <p className="px-4 py-2 rounded-lg bg-gray-50 text-gray-900">{customer.last_name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <p className="px-4 py-2 rounded-lg bg-gray-50 text-gray-900">{customer.email}</p>
                </div>

                {customer.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <p className="px-4 py-2 rounded-lg bg-gray-50 text-gray-900">{customer.phone}</p>
                  </div>
                )}

                <div className="pt-4">
                  <button className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 transition">
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="rounded-lg border border-gray-200 bg-white p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>

              {orders.length === 0 ? (
                <p className="text-gray-600">You haven't placed any orders yet.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Order {order.id}</p>
                          <p className="text-sm text-gray-600">Placed on {order.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">{order.total}</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === "Delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "In Transit"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <div className="rounded-lg border border-gray-200 bg-white p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Saved Addresses</h2>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Home</p>
                      <p className="text-sm text-gray-600 mt-2">
                        123 Main Street<br />
                        Anytown, ST 12345<br />
                        United States
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Edit
                      </button>
                      <button className="px-3 py-1 rounded-lg border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button className="mt-6 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 transition">
                Add New Address
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
