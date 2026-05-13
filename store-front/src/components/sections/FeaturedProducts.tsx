"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductGrid } from "@/components/product/ProductGrid";
import { productApi } from "@/lib/api/client";
import type { Product } from "@/lib/types/product";

export function FeaturedProducts() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string | undefined;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      if (!storeSlug) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const list = await productApi.list(storeSlug, { per_page: 8 });
        setProducts(list.slice(0, 8));
      } catch (error) {
        console.error("Failed to load featured products", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, [storeSlug]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="display-title text-3xl text-foreground">Featured Products</h2>
        <p className="text-sm text-secondary">Live inventory from your tenant APIs.</p>
      </div>

      {!storeSlug ? (
        <div className="section-shell p-12 text-center text-secondary">Open a store slug route to preview products.</div>
      ) : isLoading ? (
        <div className="section-shell p-12 text-center text-secondary">Loading products...</div>
      ) : (
        <ProductGrid products={products} storeSlug={storeSlug} />
      )}
    </section>
  );
}
