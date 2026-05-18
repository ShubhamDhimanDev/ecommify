"use client";

import Link from "next/link";
import type { Product } from "@/lib/types/product";
import { useCart } from "@/context/CartContext";
import { Heart, ShoppingBag } from "lucide-react";

export function ProductCard({ product, storeSlug }: { product: Product; storeSlug?: string }) {
  const image = product.images?.[0]?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=500&fit=crop";
  const price = parseFloat(String(product.price ?? 0));
  const { addItem, isLoading } = useCart();

  return (
    <Link href={`/${storeSlug}/products/${product.id}`}>
      <article className="group air-card flex h-full flex-col overflow-hidden rounded-[22px] transition-all hover:-translate-y-0.5 hover:shadow-[rgba(0,0,0,0.08)_0px_4px_12px]">
        {/* Image Container */}
        <div className="relative h-72 overflow-hidden bg-surface-low md:h-80">
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow"
            aria-label="Save product"
          >
            <Heart className="h-4 w-4" />
          </button>
          
          {/* Stock Badge */}
          {product.stock !== undefined && (
            <>
              {product.stock === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/30">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-foreground">Out of Stock</span>
                </div>
              )}
              {product.stock > 0 && product.stock < 5 && (
                <span className="absolute left-3 top-3 rounded-full bg-error px-3 py-1 text-xs font-semibold text-on-primary">
                  Only {product.stock} left
                </span>
              )}
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          {/* Category */}
          {product.category_name && (
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-secondary">
              {product.category_name}
            </p>
          )}

          {/* Product Name */}
          <h3 className="headline-sm mb-3 line-clamp-2 text-foreground group-hover:text-primary transition">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="mb-4 flex-grow line-clamp-2 text-sm text-secondary">
              {product.description}
            </p>
          )}

          {/* Footer: Price & Button */}
          <div className="flex items-center justify-between border-t border-outline-variant/50 pt-4">
            <span className="text-lg font-bold text-foreground">
              ${price.toFixed(2)}
            </span>
            <button
              type="button"
              disabled={product.stock === 0}
              onClick={(e) => {
                e.preventDefault();
                addItem(product, 1).catch((error) => {
                  console.error("Failed to add item to cart", error);
                });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" />
              {isLoading ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
