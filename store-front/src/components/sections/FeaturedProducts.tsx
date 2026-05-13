"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { productApi } from "@/lib/api/client";
import type { Product } from "@/lib/types/product";
import { MoveRight } from "lucide-react";

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
    <section className="space-y-8 py-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="headline-md text-foreground">Featured Collection</h2>
          <p className="mt-2 text-secondary">Explore our curated selection of premium products.</p>
        </div>
        <Link
          href={`/${storeSlug}/products`}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-secondary transition whitespace-nowrap"
        >
          View All <MoveRight className="h-4 w-4" />
        </Link>
      </div>

      {!storeSlug ? (
        <div className="py-16 text-center text-secondary">Open a store slug route to preview products.</div>
      ) : isLoading ? (
        <div className="py-16 text-center text-secondary">Loading products...</div>
      ) : (
        <ProductGrid products={products} storeSlug={storeSlug} />
      )}
    </section>
  );
}
