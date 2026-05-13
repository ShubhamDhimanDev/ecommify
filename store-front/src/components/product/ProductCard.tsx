"use client";

import Link from "next/link";
import type { Product } from "@/lib/types/product";
import { useCart } from "@/context/CartContext";
import { ShoppingBag } from "lucide-react";

export function ProductCard({ product, storeSlug }: { product: Product; storeSlug?: string }) {
  const image = product.images?.[0]?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=500&fit=crop";
  const price = parseFloat(String(product.price ?? 0));
  const { addItem, isLoading } = useCart();

  return (
    <Link href={`/${storeSlug}/products/${product.id}`}>
      <article className="group flex flex-col h-full overflow-hidden rounded-lg bg-surface transition-all hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
        {/* Image Container */}
        <div className="relative h-72 overflow-hidden bg-surface-low">
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Stock Badge */}
          {product.stock !== undefined && (
            <>
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center">
                  <span className="text-on-primary font-medium">Out of Stock</span>
                </div>
              )}
              {product.stock > 0 && product.stock < 5 && (
                <span className="absolute right-4 top-4 bg-error text-on-primary px-3 py-1 rounded-full text-xs font-semibold">
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
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-secondary">
              {product.category_name}
            </p>
          )}

          {/* Product Name */}
          <h3 className="headline-sm mb-3 line-clamp-2 text-foreground group-hover:text-secondary transition">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-secondary line-clamp-2 mb-4 flex-grow">
              {product.description}
            </p>
          )}

          {/* Footer: Price & Button */}
          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
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
              className="inline-flex items-center justify-center gap-2 bg-primary px-4 py-2 rounded-lg text-on-primary font-medium text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
