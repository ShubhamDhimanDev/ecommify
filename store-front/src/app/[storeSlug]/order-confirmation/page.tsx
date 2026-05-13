"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getOrderById } from "@/lib/orders/localOrders";

export default function OrderConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeSlug = params?.storeSlug as string;
  const orderId = searchParams.get("orderId") ?? "";

  const order = useMemo(() => {
    if (!orderId) return null;
    return getOrderById(storeSlug, orderId);
  }, [storeSlug, orderId]);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          Order not found. Please check your account orders for latest purchases.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Success Message */}
      <div className="text-center mb-12">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Thank You!</h1>
        <p className="text-xl text-gray-600 mb-4">Your order has been confirmed</p>
        <p className="text-gray-600">Order #<strong>{order.id}</strong></p>
      </div>

      {/* Order Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-8 mb-8">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date:</span>
              <span className="font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Total:</span>
              <span className="font-bold text-lg">${order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                <span className="font-medium capitalize">{order.status}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="border-t pt-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Items Ordered</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={`${item.product_id}-${item.product_name}`} className="flex gap-4">
                <img
                  src={item.image_url || "https://via.placeholder.com/80x80?text=Product"}
                  alt={item.product_name}
                  className="h-20 w-20 rounded object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.product_name}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  <p className="text-sm font-medium text-gray-900">${(item.unit_price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="border-t pt-6">
          <h3 className="font-bold text-gray-900 mb-3">Shipping Address</h3>
          <p className="text-gray-600">
            {order.shipping_address.first_name} {order.shipping_address.last_name}<br />
            {order.shipping_address.address}<br />
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}<br />
            {order.shipping_address.country}
          </p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 mb-8">
        <h3 className="font-bold text-gray-900 mb-3">What's Next?</h3>
        <ol className="space-y-2 text-gray-700">
          <li>✓ Order confirmed</li>
          <li>→ We'll send you an email when your order ships</li>
          <li>→ Track your shipment in your account</li>
          <li>→ Receive your package at your door</li>
        </ol>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href={`/${storeSlug}/account`}
          className="flex-1 text-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition"
        >
          View My Orders
        </Link>
        <Link
          href={`/${storeSlug}/products`}
          className="flex-1 text-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          Continue Shopping
        </Link>
      </div>

      {/* Support */}
      <div className="mt-12 border-t pt-8 text-center">
        <p className="text-gray-600 mb-4">Need help? We're here for you!</p>
        <div className="flex justify-center gap-4">
          <a href="mailto:support@store.com" className="text-blue-600 hover:text-blue-700 font-medium">
            Email Support
          </a>
          <span className="text-gray-400">•</span>
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            Contact Us
          </a>
          <span className="text-gray-400">•</span>
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            FAQ
          </a>
        </div>
      </div>
    </div>
  );
}
