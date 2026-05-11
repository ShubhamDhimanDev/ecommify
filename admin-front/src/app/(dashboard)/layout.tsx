"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { authApi } from "@/lib/api";
import type { ReactNode } from "react";

const NO_STORE_EXEMPT = ["/dashboard/store/new", "/dashboard/profile", "/dashboard/security"];
const MULTI_STORE_EXEMPT = ["/dashboard/store/select", "/dashboard/profile", "/dashboard/security"];

function EmailVerificationBanner() {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.email_verified_at) return null;

  async function handleResend() {
    setResending(true);
    try {
      await authApi.resendVerification();
      setSent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-4 text-sm">
      <span className="text-amber-800">
        Please verify your email address. Check your inbox for a verification link.
      </span>
      {sent ? (
        <span className="text-amber-700 font-medium shrink-0">Sent!</span>
      ) : (
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-amber-700 font-medium underline underline-offset-2 hover:text-amber-900 disabled:opacity-50 shrink-0"
        >
          {resending ? "Sending…" : "Resend email"}
        </button>
      )}
    </div>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { stores, activeStore, isLoading: storesLoading, selectStore } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  const isNoStoreExempt = NO_STORE_EXEMPT.some((p) => pathname.startsWith(p));
  const isMultiStoreExempt = MULTI_STORE_EXEMPT.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (isLoading || storesLoading || !user) return;

    if (stores.length === 0 && !isNoStoreExempt) {
      router.replace("/dashboard/store/new");
      return;
    }

    if (stores.length === 1) {
      if (!activeStore || activeStore.id !== stores[0].id) {
        selectStore(stores[0].id);
      }

      if (pathname.startsWith("/dashboard/store/select")) {
        router.replace("/dashboard");
      }

      return;
    }

    if (stores.length > 1 && !activeStore && !isMultiStoreExempt) {
      router.replace("/dashboard/store/select");
    }
  }, [
    isLoading,
    storesLoading,
    user,
    stores,
    activeStore,
    isNoStoreExempt,
    isMultiStoreExempt,
    pathname,
    router,
    selectStore,
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <EmailVerificationBanner />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireAuth>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
