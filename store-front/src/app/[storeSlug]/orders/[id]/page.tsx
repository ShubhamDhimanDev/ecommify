"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { getOrderById } from "@/lib/orders/localOrders";

export default function OrderDetailPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const orderId = params?.id as string;

  const order = useMemo(() => getOrderById(storeSlug, orderId), [storeSlug, orderId]);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-800">
          Order not found. <Link href={`/${storeSlug}/account`} className="underline">Go back to your account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Order {order.id}</h1>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 capitalize">
          {order.status}
        </span>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">Placed on {new Date(order.created_at).toLocaleString()}</p>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div key={`${item.product_id}-${item.product_name}`} className="flex items-center justify-between border-b pb-3 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">{item.product_name}</p>
                <p className="text-sm text-gray-600">Qty {item.quantity}</p>
              </div>
              <p className="font-semibold text-gray-900">${(item.quantity * item.unit_price).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Tax</span><span>${order.tax.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Shipping</span><span>${order.shipping.toFixed(2)}</span></div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold text-gray-900"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}
