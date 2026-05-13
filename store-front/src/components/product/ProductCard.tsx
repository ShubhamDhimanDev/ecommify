import Link from "next/link";
import type { Product } from "@/lib/types/product";

export function ProductCard({ product, storeSlug }: { product: Product; storeSlug?: string }) {
  const image = product.images?.[0]?.image_url || "https://via.placeholder.com/400x300?text=Product";
  const price = parseFloat(String(product.price ?? 0));
  const rating = 4.5; // Placeholder rating
  const reviewCount = 128; // Placeholder reviews

  return (
    <Link href={`/${storeSlug}/products/${product.id}`}>
      <article className="group flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition">
        {/* Image Container */}
        <div className="relative overflow-hidden bg-gray-100 h-64">
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
          />
          {product.stock && product.stock < 5 && (
            <span className="absolute top-3 right-3 rounded-full bg-red-500 text-white text-xs font-bold px-3 py-1">
              Only {product.stock} left
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-white font-bold">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <p className="text-xs font-medium text-blue-600 mb-1">{product.category_name || "Uncategorized"}</p>
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="mt-2 flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500">({reviewCount})</span>
          </div>

          {/* Description */}
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{product.description || "No description available"}</p>

          {/* Price and Button */}
          <div className="mt-auto flex items-center justify-between pt-4">
            <div>
              <span className="text-lg font-bold text-gray-900">${price.toFixed(2)}</span>
            </div>
            <button
              disabled={product.stock === 0}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
