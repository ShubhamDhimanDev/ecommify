"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { categoryApi } from "@/lib/api/client";
import type { Category } from "@/lib/types/product";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";

interface HeaderProps {
  storeSlug: string;
}

export function Header({ storeSlug }: HeaderProps) {
  const { store } = useStore();
  const { isAuthenticated, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 bg-surface">
      <div className="hidden border-b border-outline-variant/30 bg-surface-container px-4 py-2 text-xs text-secondary sm:block">
        <div className="mx-auto max-w-7xl text-center">Free shipping on orders over $150</div>
      </div>

      <nav className="border-b border-outline-variant/30 px-4 py-4 sm:py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 transition hover:bg-surface-container md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href={`/${storeSlug}`} className="absolute left-1/2 -translate-x-1/2 md:relative md:translate-x-0">
              <div className="text-center md:text-left">
                <h1 className="display-title text-xl tracking-tight text-foreground md:text-2xl">{store?.name || "Store"}</h1>
              </div>
            </Link>

            <div className="flex items-center gap-4 md:gap-6">
              <button className="hidden rounded-lg p-2 transition hover:bg-surface-container sm:block" aria-label="Search">
                <Search className="h-5 w-5 text-foreground" />
              </button>

              <Link
                href={isAuthenticated ? `/${storeSlug}/account` : `/${storeSlug}/login`}
                className="rounded-lg p-2 transition hover:bg-surface-container"
                aria-label="Account"
              >
                <UserRound className="h-5 w-5 text-foreground" />
              </Link>

              <Link
                href={`/${storeSlug}/cart`}
                className="relative rounded-lg p-2 transition hover:bg-surface-container"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5 text-foreground" />
                <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                  0
                </span>
              </Link>
            </div>
          </div>

          <div className="mt-6 hidden items-center justify-center gap-8 md:flex">
            <Link href={`/${storeSlug}`} className="text-sm font-medium text-secondary transition hover:text-foreground">
              Home
            </Link>
            <Link
              href={`/${storeSlug}/products`}
              className="text-sm font-medium text-secondary transition hover:text-foreground"
            >
              Shop All
            </Link>
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/${storeSlug}/products?category=${cat.id}`}
                className="text-sm font-medium text-secondary transition hover:text-foreground"
              >
                {cat.name}
              </Link>
            ))}
            {categories.length > 4 && (
              <div className="group relative">
                <button className="text-sm font-medium text-secondary transition hover:text-foreground">More</button>
                <div className="absolute left-0 top-full hidden pt-2 group-hover:block">
                  <div className="rounded-lg border border-outline-variant bg-surface shadow-lg">
                    {categories.slice(4).map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/${storeSlug}/products?category=${cat.id}`}
                        className="block px-4 py-2 text-sm text-secondary transition first:rounded-t-lg last:rounded-b-lg hover:bg-surface-container"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {mobileMenuOpen && (
            <div className="mt-6 flex flex-col gap-3 md:hidden">
              <Link
                href={`/${storeSlug}`}
                className="rounded px-2 py-2 text-sm font-medium text-secondary transition hover:bg-surface-container hover:text-foreground"
              >
                Home
              </Link>
              <Link
                href={`/${storeSlug}/products`}
                className="rounded px-2 py-2 text-sm font-medium text-secondary transition hover:bg-surface-container hover:text-foreground"
              >
                Shop All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${storeSlug}/products?category=${cat.id}`}
                  className="rounded px-2 py-2 text-sm text-secondary transition hover:bg-surface-container hover:text-foreground"
                >
                  {cat.name}
                </Link>
              ))}

              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="rounded px-2 py-2 text-left text-sm font-medium text-error transition hover:bg-red-50"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href={`/${storeSlug}/login`}
                    className="rounded px-2 py-2 text-sm font-medium text-secondary transition hover:bg-surface-container hover:text-foreground"
                  >
                    Login
                  </Link>
                  <Link
                    href={`/${storeSlug}/register`}
                    className="rounded px-2 py-2 text-sm font-medium text-secondary transition hover:bg-surface-container hover:text-foreground"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
