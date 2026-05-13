"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params?.storeSlug as string;
  const { isAuthenticated } = useAuth();
  const { store } = useStore();
  const { items, removeItem, updateQuantity, getSubtotal, getTotal } = useCart();

  const subtotal = getSubtotal();
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = getTotal();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {items.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <p className="text-lg text-gray-600 mb-4">Your cart is empty</p>
              <Link
                href={`/${storeSlug}/products`}
                className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 transition"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4 flex gap-4">
                  <img
                    src={item.product.images?.[0]?.image_url || "https://via.placeholder.com/100x100?text=Product"}
                    alt={item.product.name}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <Link
                      href={`/${storeSlug}/products/${item.product.id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">${item.unitPrice.toFixed(2)}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 1))}
                        className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        −
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
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

        {/* Order Summary */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

          <div className="space-y-4 mb-6">
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
            <div className="border-t pt-4 flex justify-between font-bold text-lg text-gray-900">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {isAuthenticated ? (
            <button
              onClick={() => router.push(`/${storeSlug}/checkout`)}
              disabled={items.length === 0}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              Proceed to Checkout
            </button>
          ) : (
            <Link
              href={`/${storeSlug}/login`}
              className="block w-full text-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 transition"
            >
              Sign In to Checkout
            </Link>
          )}

          <Link
            href={`/${storeSlug}/products`}
            className="mt-4 block w-full text-center rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Continue Shopping
          </Link>

          {shipping !== 0 && (
            <p className="mt-4 text-xs text-gray-600">
              Free shipping on orders over $50!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
