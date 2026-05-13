import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/types/product";

export function ProductGrid({ products, storeSlug }: { products: Product[]; storeSlug?: string }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">No products found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
      ))}
    </div>
  );
}
