import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/lib/types/product";

const PLACEHOLDER_PRODUCTS: Product[] = [
  { id: "1", name: "Starter Product", price: 19.99, description: "Placeholder" },
  { id: "2", name: "Featured Product", price: 39.99, description: "Placeholder" },
  { id: "3", name: "Popular Product", price: 29.99, description: "Placeholder" },
];

export function FeaturedProducts() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Featured Products</h2>
        <p className="text-sm text-zinc-500">Preview content for Phase 1.</p>
      </div>
      <ProductGrid products={PLACEHOLDER_PRODUCTS} />
    </section>
  );
}
