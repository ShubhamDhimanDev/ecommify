"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { store } = useStore();
  const { customer, isAuthenticated } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold text-zinc-900">
          {store?.name || "Ecommify Store"}
        </Link>
        <nav className="flex items-center gap-6 text-sm text-zinc-600">
          <Link href="/" className="hover:text-zinc-900">
            Home
          </Link>
          {store && (
            <>
              <Link href={`/${store.slug}/products`} className="hover:text-zinc-900">
                Products
              </Link>
              <Link href={`/${store.slug}/cart`} className="hover:text-zinc-900">
                Cart
              </Link>
            </>
          )}
          {isAuthenticated ? (
            <>
              <Link href={`/${store?.slug}/account`} className="hover:text-zinc-900">
                {customer?.first_name}
              </Link>
            </>
          ) : (
            <>
              <Link href={`/${store?.slug}/login`} className="hover:text-zinc-900">
                Login
              </Link>
              <Link href={`/${store?.slug}/register`} className="hover:text-zinc-900">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
