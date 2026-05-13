"use client";

import { useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { Placeholder } from "@/components/ui/Placeholder";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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

  return (
    <div className="flex flex-col min-h-screen">
      <Header storeSlug={storeSlug} />
      <main className="flex-1">{children}</main>
      <Footer storeSlug={storeSlug} />
    </div>
  );
}
