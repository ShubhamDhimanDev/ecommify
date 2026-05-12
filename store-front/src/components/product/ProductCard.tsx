import type { Product } from "@/lib/types/product";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="font-medium text-zinc-900">{product.name}</h3>
      <p className="mt-1 text-sm text-zinc-500">{product.description ?? "Coming in Phase 2"}</p>
      <p className="mt-3 text-sm font-semibold text-zinc-900">{product.price.toFixed(2)}</p>
    </article>
  );
}
