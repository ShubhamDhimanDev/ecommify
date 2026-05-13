"use client";

import { PaymentGatewayManager } from "@/components/PaymentGatewayManager";

export default function PaymentsPage() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <PaymentGatewayManager />
    </div>
  );
}
