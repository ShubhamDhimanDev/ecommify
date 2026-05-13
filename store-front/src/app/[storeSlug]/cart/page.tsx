"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { ShoppingBag } from "lucide-react";

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params?.storeSlug as string;
  const { isAuthenticated } = useAuth();
  const { items, removeItem, updateQuantity, getSubtotal, getTotal } = useCart();

  const subtotal = getSubtotal();
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = getTotal();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="display-title mb-8 text-4xl text-foreground">Shopping Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {items.length === 0 ? (
            <div className="section-shell p-12 text-center">
              <p className="mb-4 text-lg text-secondary">Your cart is empty</p>
              <Link
                href={`/${storeSlug}/products`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-semibold text-on-primary hover:opacity-90"
              >
                <ShoppingBag className="h-4 w-4" />
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-xl border border-outline-variant bg-surface p-4">
                  <img
                    src={item.product.images?.[0]?.image_url || "https://via.placeholder.com/100x100?text=Product"}
                    alt={item.product.name}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <Link
                      href={`/${storeSlug}/products/${item.product.id}`}
                      className="font-semibold text-foreground hover:text-secondary"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-1 text-sm text-secondary">${item.unitPrice.toFixed(2)}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 1))}
                        className="rounded border border-outline-variant px-2 py-1 hover:bg-surface-low"
                      >
                        −
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="rounded border border-outline-variant px-2 py-1 hover:bg-surface-low"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-shell h-fit p-6">
          <h2 className="mb-6 text-xl font-bold text-foreground">Order Summary</h2>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-secondary">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between border-t border-outline-variant pt-4 text-lg font-bold text-foreground">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {isAuthenticated ? (
            <button
              onClick={() => router.push(`/${storeSlug}/checkout`)}
              disabled={items.length === 0}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Proceed to Checkout
            </button>
          ) : (
            <Link
              href={`/${storeSlug}/login`}
              className="block w-full rounded-lg bg-primary px-4 py-3 text-center font-semibold text-on-primary hover:opacity-90"
            >
              Sign In to Checkout
            </Link>
          )}

          <Link
            href={`/${storeSlug}/products`}
            className="mt-4 block w-full rounded-lg border border-outline-variant px-4 py-3 text-center font-semibold text-secondary hover:bg-surface-low"
          >
            Continue Shopping
          </Link>

          {shipping !== 0 && (
            <p className="mt-4 text-xs text-secondary">
              Free shipping on orders over $50!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
