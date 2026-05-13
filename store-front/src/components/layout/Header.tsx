"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { categoryApi } from "@/lib/api/client";
import type { Category } from "@/lib/types/product";
import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";

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
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-md">
      <div className="border-b border-outline-variant/40 bg-surface-container px-4 py-2 text-xs text-secondary">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span>Welcome to {store?.name || "Our Store"}</span>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <span className="font-medium text-foreground">{customer?.first_name}</span>
                <button onClick={logout} className="hover:text-foreground">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href={`/${storeSlug}/login`} className="hover:text-foreground">
                  Login
                </Link>
                <Link href={`/${storeSlug}/register`} className="hover:text-foreground">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href={`/${storeSlug}`} className="flex items-center gap-3">
            {store?.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-on-primary">{store?.name?.charAt(0) || "S"}</span>
              </div>
            )}
            <div>
              <h1 className="display-title text-lg text-foreground">{store?.name || "Store"}</h1>
              <p className="text-xs text-secondary">{store?.business_name || "Curated goods, reimagined."}</p>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
            <Link href={`/${storeSlug}`} className="text-sm font-medium text-secondary hover:text-foreground">
              Home
            </Link>
            <Link href={`/${storeSlug}/products`} className="text-sm font-medium text-secondary hover:text-foreground">
              Shop All
            </Link>
            {categories.length > 0 && (
              <div className="group relative">
                <button className="text-sm font-medium text-secondary hover:text-foreground">Categories</button>
                <div className="absolute left-0 top-full hidden w-56 rounded-xl border border-outline-variant bg-surface shadow-lg group-hover:block">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/${storeSlug}/products?category=${cat.id}`}
                      className="block px-4 py-2 text-sm text-secondary hover:bg-surface-container first:rounded-t-xl last:rounded-b-xl"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-secondary hover:bg-surface-container md:inline-flex"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <Link
              href={isAuthenticated ? `/${storeSlug}/account` : `/${storeSlug}/login`}
              className="hidden h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-secondary hover:bg-surface-container md:inline-flex"
            >
              <UserRound className="h-4 w-4" />
            </Link>

            <Link
              href={`/${storeSlug}/cart`}
              className="relative inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:opacity-90"
            >
              <ShoppingBag className="h-4 w-4" /> Cart
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                0
              </span>
            </Link>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-secondary hover:bg-surface-container md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="overflow-x-auto border-t border-outline-variant/50 bg-surface-container px-4 py-2 md:hidden">
          <div className="flex gap-2">
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                href={`/${storeSlug}/products?category=${cat.id}`}
                className="whitespace-nowrap rounded-full border border-outline-variant bg-surface px-3 py-1 text-xs font-medium text-secondary hover:bg-surface-low"
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
