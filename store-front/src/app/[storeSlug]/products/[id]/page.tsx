"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { productApi } from "@/lib/api/client";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types/product";
import { ShieldCheck, Star, Truck, Undo2 } from "lucide-react";

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
      setProduct(data || null);
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
        <p className="text-secondary">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-secondary">Product not found</p>
      </div>
    );
  }

  const images = product.images || [];
  const mainImage = images[selectedImage]?.image_url || "https://via.placeholder.com/600x600?text=Product";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <div className="mb-4 overflow-hidden rounded-2xl border border-outline-variant bg-surface-low">
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
                  className={`overflow-hidden rounded-lg border-2 ${
                    selectedImage === idx ? "border-primary" : "border-outline-variant"
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

        <div>
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">{product.category_name || "Category"}</p>
            <h1 className="display-title text-5xl text-foreground">{product.name}</h1>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm text-secondary">(128 reviews)</span>
          </div>

          <div className="mb-6">
            <span className="text-4xl font-bold text-foreground">${parseFloat(String(product.price ?? 0)).toFixed(2)}</span>
          </div>

          <p className="mb-6 leading-relaxed text-secondary">
            {product.description || "No description available for this product."}
          </p>

          {product.sku && (
            <div className="mb-6 flex gap-4">
              <span className="text-sm text-secondary">SKU: <strong>{product.sku}</strong></span>
              <span className="text-sm text-secondary">
                Stock: <strong>{product.stock || 0} available</strong>
              </span>
            </div>
          )}

          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-secondary">Quantity:</label>
              <div className="flex items-center rounded-lg border border-outline-variant">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-secondary hover:bg-surface-low"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-secondary hover:bg-surface-low"
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
                className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {addingToCart ? "Adding..." : "Add to Cart"}
              </button>
              <button className="flex-1 rounded-lg border border-outline-variant px-6 py-3 font-semibold text-secondary hover:bg-surface-low">
                ♥ Wishlist
              </button>
            </div>
          </div>

          <div className="space-y-3 border-t border-outline-variant pt-6">
            <div className="flex gap-3">
              <Truck className="h-6 w-6 text-secondary" />
              <div>
                <p className="font-semibold text-foreground">Free Shipping</p>
                <p className="text-sm text-secondary">On orders over $50</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="h-6 w-6 text-secondary" />
              <div>
                <p className="font-semibold text-foreground">Secure Payment</p>
                <p className="text-sm text-secondary">100% protected transaction</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Undo2 className="h-6 w-6 text-secondary" />
              <div>
                <p className="font-semibold text-foreground">Easy Returns</p>
                <p className="text-sm text-secondary">30-day money back guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 border-t border-outline-variant pt-12">
        <h2 className="mb-6 text-2xl font-bold text-foreground">Related Products</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-outline-variant bg-surface p-4">
              <div className="mb-4 h-40 rounded-lg bg-surface-low" />
              <p className="font-semibold text-foreground">Related Product {i + 1}</p>
              <p className="mt-2 text-lg font-bold text-foreground">$99.99</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
