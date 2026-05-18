import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/types/product";

export function ProductGrid({ products, storeSlug }: { products: Product[]; storeSlug?: string }) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-secondary">No products found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
      ))}
    </div>
  );
}
