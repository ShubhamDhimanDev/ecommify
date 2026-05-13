"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardPage() {
  const { activeStore, stores, isLoading } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (activeStore) {
      router.replace(`/${activeStore.slug}`);
    } else if (stores.length === 0) {
      router.replace("/dashboard/store/new");
    } else if (stores.length > 1) {
      router.replace("/dashboard/store/select");
    }
    // single store with no activeStore yet: StoreContext will auto-select, re-triggering this effect
  }, [activeStore, stores, isLoading, router]);

  return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
}
