"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { themeApi } from "@/lib/api/client";
import { ShoppingBag, Trash2 } from "lucide-react";

type CartThemeSettings = {
  title?: string;
  emptyStateTitle?: string;
  emptyStateCtaLabel?: string;
  summaryTitle?: string;
  checkoutLabel?: string;
  signinCheckoutLabel?: string;
  continueShoppingLabel?: string;
  freeShippingMessage?: string;
  freeShippingThreshold?: number;
};

function extractCartSettings(payload: unknown): CartThemeSettings | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = (payload as { data?: unknown }).data ?? payload;
  if (!root || typeof root !== "object") {
    return null;
  }

  const config = (root as { config?: { pages?: Record<string, { sections?: Array<{ type?: string; settings?: Record<string, unknown> }> }> } }).config;
  const sections = config?.pages?.cart?.sections;

  if (!Array.isArray(sections)) {
    return null;
  }

  const layout = sections.find((section) => section?.type === "cart-layout");
  const settings = layout?.settings;

  if (!settings || typeof settings !== "object") {
    return null;
  }

  return {
    title: typeof settings.title === "string" ? settings.title : undefined,
    emptyStateTitle: typeof settings.empty_state_title === "string" ? settings.empty_state_title : undefined,
    emptyStateCtaLabel: typeof settings.empty_state_cta_label === "string" ? settings.empty_state_cta_label : undefined,
    summaryTitle: typeof settings.summary_title === "string" ? settings.summary_title : undefined,
    checkoutLabel: typeof settings.checkout_label === "string" ? settings.checkout_label : undefined,
    signinCheckoutLabel: typeof settings.signin_checkout_label === "string" ? settings.signin_checkout_label : undefined,
    continueShoppingLabel: typeof settings.continue_shopping_label === "string" ? settings.continue_shopping_label : undefined,
    freeShippingMessage: typeof settings.free_shipping_message === "string" ? settings.free_shipping_message : undefined,
    freeShippingThreshold:
      typeof settings.free_shipping_threshold === "number"
        ? settings.free_shipping_threshold
        : typeof settings.free_shipping_threshold === "string"
          ? Number(settings.free_shipping_threshold)
          : undefined,
  };
}

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeSlug = params?.storeSlug as string;
  const previewTheme = searchParams.get("preview_theme");
  const previewPage = searchParams.get("preview_page");
  const { isAuthenticated } = useAuth();
  const { items, removeItem, updateQuantity, getSubtotal, getTotal } = useCart();
  const [cartTheme, setCartTheme] = useState<CartThemeSettings | null>(null);

  useEffect(() => {
    if (!storeSlug) {
      return;
    }

    void themeApi
      .getByStoreSlug(storeSlug, {
        theme: previewTheme,
        page: previewPage,
      })
      .then((payload) => {
        setCartTheme(extractCartSettings(payload));
      })
      .catch(() => null);
  }, [previewPage, previewTheme, storeSlug]);

  const subtotal = getSubtotal();
  const tax = subtotal * 0.1; // 10% tax
  const freeShippingThreshold = Number.isFinite(cartTheme?.freeShippingThreshold)
    ? Number(cartTheme?.freeShippingThreshold)
    : 75;
  const shipping = subtotal > freeShippingThreshold ? 0 : 9.99;
  const total = getTotal();

  return (
    <div>
      {/* Page Header */}
      <div className="border-b border-outline-variant/30 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="headline-md text-foreground">{cartTheme?.title || "Shopping Cart"}</h1>
          <p className="text-secondary mt-2">{items.length} item{items.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {items.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingBag className="h-16 w-16 text-outline-variant mx-auto mb-4" />
                <p className="text-lg text-secondary mb-6">{cartTheme?.emptyStateTitle || "Your cart is empty"}</p>
                <Link
                  href={`/${storeSlug}/products`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-medium text-on-primary hover:opacity-90 transition"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {cartTheme?.emptyStateCtaLabel || "Start Shopping"}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 rounded-lg border border-outline-variant/30 bg-surface hover:shadow-md transition p-4 md:p-6">
                    {/* Product Image */}
                    <Link href={`/${storeSlug}/products/${item.product.id}`} className="flex-shrink-0">
                      <img
                        src={item.product.images?.[0]?.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop"}
                        alt={item.product.name}
                        className="h-28 w-28 rounded-lg object-cover"
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1">
                      <Link
                        href={`/${storeSlug}/products/${item.product.id}`}
                        className="font-semibold text-foreground hover:text-secondary transition"
                      >
                        {item.product.name}
                      </Link>
                      <p className="mt-1 text-sm text-secondary">{item.product.category_name || "Uncategorized"}</p>
                      <p className="mt-3 text-lg font-semibold text-foreground">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-secondary">${item.unitPrice.toFixed(2)} each</p>

                      {/* Quantity Controls */}
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="rounded border border-outline-variant/50 px-3 py-1 text-secondary hover:bg-surface-container transition"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="rounded border border-outline-variant/50 px-3 py-1 text-secondary hover:bg-surface-container transition"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-2 text-outline hover:bg-red-50 hover:text-error rounded transition"
                        title="Remove from cart"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {items.length > 0 && (
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-lg border border-outline-variant/30 bg-surface-container p-6">
                <h2 className="font-semibold text-foreground mb-6">{cartTheme?.summaryTitle || "Order Summary"}</h2>

                <div className="space-y-3 mb-6 pb-6 border-b border-outline-variant/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Subtotal</span>
                    <span className="text-foreground font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Tax (10%)</span>
                    <span className="text-foreground font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Shipping</span>
                    <span className="text-foreground font-medium">
                      {shipping === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between mb-6 text-lg">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-foreground">${total.toFixed(2)}</span>
                </div>

                {isAuthenticated ? (
                  <button
                    onClick={() => router.push(`/${storeSlug}/checkout`)}
                    className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-on-primary hover:opacity-90 transition"
                  >
                    {cartTheme?.checkoutLabel || "Proceed to Checkout"}
                  </button>
                ) : (
                  <Link
                    href={`/${storeSlug}/login`}
                    className="block w-full rounded-lg bg-primary px-4 py-3 text-center font-medium text-on-primary hover:opacity-90 transition"
                  >
                    {cartTheme?.signinCheckoutLabel || "Sign In to Checkout"}
                  </Link>
                )}

                <Link
                  href={`/${storeSlug}/products`}
                  className="mt-3 block w-full rounded-lg border border-outline-variant/50 px-4 py-3 text-center font-medium text-secondary hover:bg-surface-container transition"
                >
                  {cartTheme?.continueShoppingLabel || "Continue Shopping"}
                </Link>

                {shipping !== 0 && (
                  <p className="mt-4 text-xs text-secondary text-center">
                    {cartTheme?.freeShippingMessage || `Free shipping on orders over $${freeShippingThreshold}!`}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
