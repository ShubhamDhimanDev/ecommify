"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { Spinner } from "@/components/ui/Spinner";
import type { ReactNode } from "react";

export default function SlugLayout({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const { stores, activeStore, isLoading, selectStore } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const store = stores.find((s) => s.slug === slug);
    if (!store) {
      router.replace("/dashboard");
      return;
    }

    if (!activeStore || activeStore.slug !== slug) {
      selectStore(store.id);
    }
  }, [slug, stores, activeStore, isLoading, selectStore, router]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return <>{children}</>;
}
