"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { productApi } from "@/lib/api/client";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types/product";

export default function ProductDetailPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const productId = params?.id as string;
  const { addItem, isLoading: cartLoading } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<string>("");

  useEffect(() => {
    if (storeSlug && productId) {
      loadProduct();
    }
  }, [storeSlug, productId]);

  async function loadProduct() {
    setLoading(true);
    try {
      const data = await productApi.getById(storeSlug, productId);
      setProduct((data as any).product || null);
    } catch (error) {
      console.error("Failed to load product:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!product) return;
    
    setAddingToCart(true);
    setCartMessage("");
    
    try {
      await addItem(product, quantity);
      setCartMessage(`Added ${quantity} × ${product.name} to cart!`);
      setQuantity(1);
      
      // Clear message after 3 seconds
      setTimeout(() => setCartMessage(""), 3000);
    } catch (error) {
      setCartMessage("Failed to add item to cart");
      console.error(error);
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  const images = product.images || [];
  const mainImage = images[selectedImage]?.image_url || "https://via.placeholder.com/600x600?text=Product";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-12 md:grid-cols-2">
        {/* Images */}
        <div>
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
            <img
              src={mainImage}
              alt={product.name}
              className="h-96 w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`rounded-lg border-2 overflow-hidden ${
                    selectedImage === idx ? "border-blue-500" : "border-gray-200"
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={`${product.name} ${idx + 1}`}
                    className="h-20 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="mb-4">
            <p className="text-sm font-medium text-blue-600 mb-2">{product.category_name}</p>
            <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>
          </div>

          {/* Rating */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-xl text-yellow-400">★</span>
              ))}
            </div>
            <span className="text-sm text-gray-600">(128 reviews)</span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900">${parseFloat(String(product.price ?? 0)).toFixed(2)}</span>
          </div>

          {/* Description */}
          <p className="mb-6 text-gray-600 leading-relaxed">
            {product.description || "No description available for this product."}
          </p>

          {/* SKU */}
          {product.sku && (
            <div className="mb-6 flex gap-4">
              <span className="text-sm text-gray-600">SKU: <strong>{product.sku}</strong></span>
              <span className="text-sm text-gray-600">
                Stock: <strong>{product.stock || 0} available</strong>
              </span>
            </div>
          )}

          {/* Add to Cart */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Quantity:</label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                  disabled={product.stock === 0}
                >
                  +
                </button>
              </div>
            </div>

            {cartMessage && (
              <div className={`rounded-lg p-4 ${
                cartMessage.includes("Added")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                <p className="text-sm font-medium">{cartMessage}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addingToCart || cartLoading}
                className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {addingToCart ? "Adding..." : "Add to Cart"}
              </button>
              <button className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition">
                ♥ Wishlist
              </button>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="space-y-3 border-t pt-6">
            <div className="flex gap-3">
              <span className="text-2xl">🚚</span>
              <div>
                <p className="font-semibold text-gray-900">Free Shipping</p>
                <p className="text-sm text-gray-600">On orders over $50</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="font-semibold text-gray-900">Secure Payment</p>
                <p className="text-sm text-gray-600">100% protected transaction</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">↩️</span>
              <div>
                <p className="font-semibold text-gray-900">Easy Returns</p>
                <p className="text-sm text-gray-600">30-day money back guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Placeholder */}
      <div className="mt-16 border-t pt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-4 h-40 bg-gray-100 rounded-lg" />
              <p className="font-semibold text-gray-900">Related Product {i + 1}</p>
              <p className="text-lg font-bold text-gray-900 mt-2">$99.99</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
