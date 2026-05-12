"use client";

import { useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { Placeholder } from "@/components/ui/Placeholder";
import { useParams } from "next/navigation";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const { store, isLoading, error, fetchStore } = useStore();

  useEffect(() => {
    if (storeSlug) {
      fetchStore(storeSlug);
    }
  }, [storeSlug, fetchStore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-500">Loading store...</p>
      </div>
    );
  }

  if (error) {
    return <Placeholder title="Store Not Found" />;
  }

  if (!store) {
    return <Placeholder title="Store Not Available" />;
  }

  return <>{children}</>;
}
