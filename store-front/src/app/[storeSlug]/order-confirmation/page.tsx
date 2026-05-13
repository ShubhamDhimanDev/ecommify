"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params?.storeSlug as string;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Success Message */}
      <div className="text-center mb-12">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Thank You!</h1>
        <p className="text-xl text-gray-600 mb-4">Your order has been confirmed</p>
        <p className="text-gray-600">Order #<strong>ORD-2024-001234</strong></p>
      </div>

      {/* Order Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-8 mb-8">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date:</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Total:</span>
              <span className="font-bold text-lg">$252.97</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                <span className="font-medium">Pending Confirmation</span>
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="border-t pt-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Items Ordered</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <img
                src="https://via.placeholder.com/80x80?text=Headphones"
                alt="Product"
                className="h-20 w-20 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Premium Wireless Headphones</p>
                <p className="text-sm text-gray-600">Quantity: 1</p>
                <p className="text-sm font-medium text-gray-900">$199.99</p>
              </div>
            </div>
            <div className="flex gap-4">
              <img
                src="https://via.placeholder.com/80x80?text=Cable"
                alt="Product"
                className="h-20 w-20 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">USB-C Cable 2m</p>
                <p className="text-sm text-gray-600">Quantity: 2</p>
                <p className="text-sm font-medium text-gray-900">$29.98</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="border-t pt-6">
          <h3 className="font-bold text-gray-900 mb-3">Shipping Address</h3>
          <p className="text-gray-600">
            123 Main Street<br />
            Anytown, ST 12345<br />
            United States
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
