"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { productApi } from "@/lib/api/client";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types/product";
import { ShieldCheck, Truck, Undo2, Heart, Share2 } from "lucide-react";

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
  const mainImage = images[selectedImage]?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=900&fit=crop";
  const price = parseFloat(String(product.price ?? 0));

  return (
    <>
      {/* Product Main Section */}
      <div className="border-b border-outline-variant/30">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Image Gallery */}
            <div>
              <div className="mb-4 overflow-hidden rounded-lg border border-outline-variant/40 bg-surface-low aspect-square">
                <img
                  src={mainImage}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square overflow-hidden rounded-lg border-2 transition ${
                        selectedImage === idx
                          ? "border-primary"
                          : "border-outline-variant/30 hover:border-outline-variant"
                      }`}
                    >
                      <img
                        src={img.image_url}
                        alt={`${product.name} ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <div className="mb-6">
                {product.category_name && (
                  <p className="label-caps mb-3 text-secondary">{product.category_name}</p>
                )}
                <h1 className="headline-md text-foreground mb-4">{product.name}</h1>
                <p className="body-lg text-secondary leading-relaxed">
                  {product.description || "No description available for this product."}
                </p>
              </div>

              {/* Price & Stock */}
              <div className="mb-8 pb-8 border-b border-outline-variant/30">
                <div className="mb-4">
                  <span className="display-lg-mobile text-foreground">${price.toFixed(2)}</span>
                </div>
                {product.sku && (
                  <div className="space-y-2 text-sm">
                    <p><span className="text-secondary">SKU:</span> <span className="font-medium text-foreground">{product.sku}</span></p>
                    <p><span className="text-secondary">Availability:</span> <span className="font-medium text-foreground">{product.stock ? `${product.stock} in stock` : "Out of stock"}</span></p>
                  </div>
                )}
              </div>

              {/* Quantity & Actions */}
              <div className="mb-8 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-secondary">Quantity:</span>
                  <div className="flex items-center rounded-lg border border-outline-variant/50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-secondary hover:bg-surface-container transition"
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 text-secondary hover:bg-surface-container transition"
                      disabled={product.stock === 0}
                    >
                      +
                    </button>
                  </div>
                </div>

                {cartMessage && (
                  <div className={`rounded-lg p-4 text-sm font-medium ${
                    cartMessage.includes("Added")
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {cartMessage}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || addingToCart || cartLoading}
                    className="col-span-2 rounded-lg bg-primary px-6 py-4 font-medium text-on-primary hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingToCart ? "Adding..." : "Add to Cart"}
                  </button>
                  <button className="rounded-lg border border-outline-variant/50 px-4 py-4 text-foreground hover:bg-surface-container transition flex items-center justify-center">
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="space-y-4 pt-8 border-t border-outline-variant/30">
                {[
                  { icon: Truck, title: "Free Shipping", desc: "On orders over $50" },
                  { icon: ShieldCheck, title: "Secure Payment", desc: "100% protected" },
                  { icon: Undo2, title: "Easy Returns", desc: "30-day guarantee" },
                ].map((badge, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <badge.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{badge.title}</p>
                      <p className="text-sm text-secondary">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products - Placeholder */}
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="headline-md text-foreground mb-8">You Might Also Like</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-outline-variant/30 bg-surface overflow-hidden hover:shadow-lg transition">
              <div className="mb-4 bg-surface-low aspect-square" />
              <div className="p-4">
                <p className="label-caps mb-2 text-secondary">Category</p>
                <p className="font-semibold text-foreground mb-2">Related Product</p>
                <p className="headline-sm text-foreground">$99.99</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
