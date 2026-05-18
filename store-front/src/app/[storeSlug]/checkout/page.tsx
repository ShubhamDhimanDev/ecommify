"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { saveOrder, type LocalOrder } from "@/lib/orders/localOrders";
import { themeApi } from "@/lib/api/client";
import { ChevronRight, CheckCircle2 } from "lucide-react";

type CheckoutThemeSettings = {
  title?: string;
  steps?: string[];
  summaryTitle?: string;
  freeShippingMessage?: string;
  freeShippingThreshold?: number;
};

function extractCheckoutSettings(payload: unknown): CheckoutThemeSettings | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = (payload as { data?: unknown }).data ?? payload;
  if (!root || typeof root !== "object") {
    return null;
  }

  const config = (root as { config?: { pages?: Record<string, { sections?: Array<{ type?: string; settings?: Record<string, unknown> }> }> } }).config;
  const sections = config?.pages?.checkout?.sections;

  if (!Array.isArray(sections)) {
    return null;
  }

  const layout = sections.find((section) => section?.type === "checkout-layout");
  const settings = layout?.settings;

  if (!settings || typeof settings !== "object") {
    return null;
  }

  return {
    title: typeof settings.title === "string" ? settings.title : undefined,
    steps: Array.isArray(settings.steps)
      ? settings.steps.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : undefined,
    summaryTitle: typeof settings.summary_title === "string" ? settings.summary_title : undefined,
    freeShippingMessage: typeof settings.free_shipping_message === "string" ? settings.free_shipping_message : undefined,
    freeShippingThreshold:
      typeof settings.free_shipping_threshold === "number"
        ? settings.free_shipping_threshold
        : typeof settings.free_shipping_threshold === "string"
          ? Number(settings.free_shipping_threshold)
          : undefined,
  };
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeSlug = params?.storeSlug as string;
  const previewTheme = searchParams.get("preview_theme");
  const previewPage = searchParams.get("preview_page");
  const { customer } = useAuth();
  const { items, getSubtotal, getTotal, clearCart } = useCart();

  const [step, setStep] = useState<"shipping" | "payment" | "review">("shipping");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutTheme, setCheckoutTheme] = useState<CheckoutThemeSettings | null>(null);
  const orderSequence = useRef(1);
  const [formData, setFormData] = useState({
    firstName: customer?.first_name || "",
    lastName: customer?.last_name || "",
    email: customer?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const subtotal = getSubtotal();
  const tax = subtotal * 0.1;
  const freeShippingThreshold = Number.isFinite(checkoutTheme?.freeShippingThreshold)
    ? Number(checkoutTheme?.freeShippingThreshold)
    : 75;
  const shipping = subtotal > freeShippingThreshold ? 0 : 9.99;
  const total = getTotal();

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
        setCheckoutTheme(extractCheckoutSettings(payload));
      })
      .catch(() => null);
  }, [previewPage, previewTheme, storeSlug]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step === "shipping") setStep("payment");
    else if (step === "payment") setStep("review");
    else submitOrder();
  };

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      const orderId = `ORD-${storeSlug}-${orderSequence.current++}`;

      const orderData: LocalOrder = {
        id: orderId,
        store_slug: storeSlug,
        status: "pending",
        created_at: new Date().toISOString(),
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          image_url: item.product.images?.[0]?.image_url,
        })),
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        },
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        shipping: Number(shipping.toFixed(2)),
        total: Number(total.toFixed(2)),
      };

      saveOrder(storeSlug, orderData);

      clearCart();
      router.push(`/${storeSlug}/order-confirmation?orderId=${encodeURIComponent(orderId)}`);
    } catch (error) {
      console.error("Order submission failed:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="mb-6 text-lg text-secondary">Your cart is empty</p>
        <a
          href={`/${storeSlug}/products`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-on-primary transition hover:opacity-90"
        >
          Continue Shopping <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  const steps = checkoutTheme?.steps && checkoutTheme.steps.length === 3
    ? checkoutTheme.steps
    : ["Shipping", "Payment", "Review"];
  const stepsArray = ["shipping", "payment", "review"] as const;
  const currentStepIndex = stepsArray.indexOf(step);

  return (
    <>
      <div className="border-b border-outline-variant/30 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="headline-md text-foreground">{checkoutTheme?.title || "Checkout"}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-12 flex max-w-2xl justify-between">
          {steps.map((stepName, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;

            return (
              <div key={stepName} className="flex flex-1 items-center">
                <div className="flex flex-1 items-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold transition ${
                      isCompleted
                        ? "bg-primary text-on-primary"
                        : isActive
                          ? "bg-primary text-on-primary"
                          : "border border-outline-variant/30 bg-surface-container text-secondary"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                  </div>
                  <span className={`ml-3 font-medium transition ${isActive ? "text-foreground" : "text-secondary"}`}>
                    {stepName}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`ml-4 h-px flex-1 ${isCompleted || isActive ? "bg-primary" : "bg-outline-variant/30"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === "shipping" && (
                <div className="rounded-lg border border-outline-variant/30 bg-surface p-8">
                  <h2 className="headline-sm mb-8 text-foreground">Shipping Address</h2>

                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 transition focus:border-primary focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 transition focus:border-primary focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-secondary">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 transition focus:border-primary focus:outline-none"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-secondary">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 transition focus:border-primary focus:outline-none"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-secondary">Street Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 transition focus:border-primary focus:outline-none"
                      required
                    />
                  </div>

                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 transition focus:border-primary focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 transition focus:border-primary focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary">ZIP Code</label>
                      <input
                        type="text"
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                        className="w-full rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 transition focus:border-primary focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary">Country</label>
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 transition focus:border-primary focus:outline-none"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === "payment" && (
                <div className="rounded-lg border border-outline-variant/30 bg-surface p-8">
                  <h2 className="headline-sm mb-8 text-foreground">Payment Method</h2>

                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-secondary">Cardholder Name</label>
                    <input
                      type="text"
                      value={formData.cardName}
                      onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                      className="w-full rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 transition focus:border-primary focus:outline-none"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-secondary">Card Number</label>
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                      className="w-full rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 transition focus:border-primary focus:outline-none"
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary">Expiry Date</label>
                      <input
                        type="text"
                        value={formData.expiry}
                        onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                        className="w-full rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 transition focus:border-primary focus:outline-none"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-secondary">CVV</label>
                      <input
                        type="text"
                        value={formData.cvc}
                        onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                        className="w-full rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 transition focus:border-primary focus:outline-none"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === "review" && (
                <div className="rounded-lg border border-outline-variant/30 bg-surface p-8">
                  <h2 className="headline-sm mb-6 text-foreground">Order Review</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-1 text-sm text-secondary">Shipping to:</p>
                      <p className="font-semibold text-foreground">
                        {formData.address}, {formData.city}, {formData.state} {formData.zip}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                {step !== "shipping" && (
                  <button
                    type="button"
                    onClick={() => setStep(step === "payment" ? "shipping" : "payment")}
                    className="flex-1 rounded-lg border border-outline-variant/50 px-6 py-3 font-medium text-secondary transition hover:bg-surface-container"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Processing..." : step === "review" ? "Place Order" : "Continue"}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-outline-variant/30 bg-surface-container p-8">
              <h2 className="mb-6 font-semibold text-foreground">{checkoutTheme?.summaryTitle || "Order Summary"}</h2>

              <div className="mb-6 max-h-96 space-y-3 overflow-y-auto border-b border-outline-variant/30 pb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between py-2">
                    <span className="text-sm text-secondary">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="text-sm font-medium text-foreground">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Subtotal</span>
                  <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Tax (10%)</span>
                  <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Shipping</span>
                  <span className="font-medium text-foreground">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                </div>
                {shipping !== 0 && (
                  <p className="text-xs text-secondary">
                    {checkoutTheme?.freeShippingMessage || `Free shipping on orders over $${freeShippingThreshold}!`}
                  </p>
                )}
                <div className="flex justify-between border-t border-outline-variant/30 pt-3">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
