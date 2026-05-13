"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params?.storeSlug as string;
  const { customer } = useAuth();
  const { items, getSubtotal, getTotal, clearCart } = useCart();

  const [step, setStep] = useState<"shipping" | "payment" | "review">("shipping");
  const [submitting, setSubmitting] = useState(false);
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
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = getTotal();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step === "shipping") setStep("payment");
    else if (step === "payment") setStep("review");
    else submitOrder();
  };

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      // Simulate order creation
      // In production, this would call orderApi.createOrder()
      
      const orderData = {
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
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
        subtotal,
        tax,
        shipping,
        total,
      };

      console.log("Creating order:", orderData);

      // Clear cart and redirect to confirmation
      clearCart();
      router.push(`/${storeSlug}/order-confirmation`);
    } catch (error) {
      console.error("Order submission failed:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <p className="text-lg text-gray-600 mb-4">Your cart is empty</p>
        <a href={`/${storeSlug}/products`} className="text-blue-600 hover:text-blue-700 font-medium">
          Continue Shopping
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

      {/* Step Indicator */}
      <div className="mb-8 flex justify-between">
        {["Shipping", "Payment", "Review"].map((stepName, idx) => (
          <div key={stepName} className="flex items-center flex-1">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                idx < (["shipping", "payment", "review"].indexOf(step))
                  ? "bg-green-600 text-white"
                  : step === ["shipping", "payment", "review"][idx]
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {idx < (["shipping", "payment", "review"].indexOf(step)) ? "✓" : idx + 1}
            </div>
            <span className={`ml-2 font-medium ${step === ["shipping", "payment", "review"][idx] ? "text-blue-600" : "text-gray-600"}`}>
              {stepName}
            </span>
            {idx < 2 && <div className="ml-auto h-1 flex-1 bg-gray-200 mx-4" />}
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shipping */}
            {step === "shipping" && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Payment */}
            {step === "payment" && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Holder Name</label>
                  <input
                    type="text"
                    value={formData.cardName}
                    onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={formData.expiry}
                      onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                    <input
                      type="text"
                      value={formData.cvc}
                      onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Review */}
            {step === "review" && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Review</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Shipping to:</p>
                    <p className="font-semibold text-gray-900">
                      {formData.address}, {formData.city}, {formData.state} {formData.zip}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              {step !== "shipping" && (
                <button
                  type="button"
                  onClick={() =>
                    setStep(step === "payment" ? "shipping" : "payment")
                  }
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {submitting ? "Processing..." : step === "review" ? "Place Order" : "Continue"}
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

          <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between py-2 border-b last:border-b-0">
                <span className="text-sm text-gray-600">{item.product.name} x{item.quantity}</span>
                <span className="font-medium text-sm">${(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t space-y-3 pt-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg text-gray-900">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
