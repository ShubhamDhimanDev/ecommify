"use client";

import { useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { resolveTheme, themeToCssVars } from "@/lib/theme/defaultTheme";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const { store, fetchStore } = useStore();

  useEffect(() => {
    if (storeSlug) {
      fetchStore(storeSlug);
    }
  }, [storeSlug, fetchStore]);

  const resolvedTheme = resolveTheme(store?.theme ?? store?.settings?.theme);

  return (
    <div className="flex min-h-screen flex-col" style={themeToCssVars(resolvedTheme)}>
      <Header storeSlug={storeSlug} />
      <main className="flex-1">{children}</main>
      <Footer storeSlug={storeSlug} />
    </div>
  );
}
