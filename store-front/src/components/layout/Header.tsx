"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { categoryApi } from "@/lib/api/client";
import type { Category } from "@/lib/types/product";

interface HeaderProps {
  storeSlug: string;
}

export function Header({ storeSlug }: HeaderProps) {
  const { store } = useStore();
  const { customer, isAuthenticated, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (storeSlug) {
      loadCategories();
    }
  }, [storeSlug]);

  async function loadCategories() {
    try {
      const data = await categoryApi.list(storeSlug);
      // Extract unique categories from products if include_categories was used
      setCategories((data as any).categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      {/* Top bar */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-600">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span>Welcome to {store?.name || "Our Store"}</span>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <span className="font-medium text-gray-900">{customer?.first_name}</span>
                <button onClick={logout} className="hover:text-gray-900">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href={`/${storeSlug}/login`} className="hover:text-gray-900">
                  Login
                </Link>
                <Link href={`/${storeSlug}/register`} className="hover:text-gray-900">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href={`/${storeSlug}`} className="flex items-center gap-3">
            {store?.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-lg font-bold text-white">{store?.name?.charAt(0) || "S"}</span>
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">{store?.name || "Store"}</h1>
              <p className="text-xs text-gray-500">{store?.business_name}</p>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
            <Link href={`/${storeSlug}`} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">
              Home
            </Link>
            <Link href={`/${storeSlug}/products`} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">
              Shop All
            </Link>
            {categories.length > 0 && (
              <div className="group relative">
                <button className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">Categories</button>
                <div className="absolute left-0 top-full hidden w-48 rounded-lg border border-gray-200 bg-white shadow-lg group-hover:block">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/${storeSlug}/products?category=${cat.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 first:rounded-t-lg last:rounded-b-lg transition"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={`/${storeSlug}/cart`}
              className="relative inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              🛒 Cart
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                0
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile category nav */}
      {categories.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 md:hidden overflow-x-auto">
          <div className="flex gap-2">
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                href={`/${storeSlug}/products?category=${cat.id}`}
                className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-blue-50 transition"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
