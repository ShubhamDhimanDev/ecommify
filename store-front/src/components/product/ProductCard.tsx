"use client";

import Link from "next/link";
import type { Product } from "@/lib/types/product";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, Star } from "lucide-react";

export function ProductCard({ product, storeSlug }: { product: Product; storeSlug?: string }) {
  const image = product.images?.[0]?.image_url || "https://via.placeholder.com/400x300?text=Product";
  const price = parseFloat(String(product.price ?? 0));
  const rating = 4.5;
  const reviewCount = 128;
  const { addItem, isLoading } = useCart();

  return (
    <Link href={`/${storeSlug}/products/${product.id}`}>
      <article className="group flex flex-col overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface transition hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(15,15,15,0.08)]">
        <div className="relative h-64 overflow-hidden bg-surface-low">
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
          />
          {product.stock && product.stock < 5 && (
            <span className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
              Only {product.stock} left
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-white font-bold">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-secondary">{product.category_name || "Uncategorized"}</p>
          <h3 className="line-clamp-2 font-semibold text-foreground group-hover:text-secondary">
            {product.name}
          </h3>

          <div className="mt-2 flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-outline-variant"}`} />
              ))}
            </div>
            <span className="text-xs text-secondary">({reviewCount})</span>
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-secondary">{product.description || "No description available"}</p>

          <div className="mt-auto flex items-center justify-between pt-4">
            <div>
              <span className="text-lg font-bold text-foreground">${price.toFixed(2)}</span>
            </div>
            <button
              type="button"
              disabled={product.stock === 0}
              onClick={(event) => {
                event.preventDefault();
                addItem(product, 1).catch((error) => {
                  console.error("Failed to add item to cart", error);
                });
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {isLoading ? "Adding" : "Add"}
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
