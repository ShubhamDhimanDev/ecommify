<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderStatusEvent;
use App\Models\PaymentTransaction;
use App\Models\Tenant;
use App\Services\PaymentService\DTOs\PaymentRequestDTO;
use App\Services\PaymentService\DTOs\RefundRequestDTO;
use App\Services\PaymentService\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $validated = $request->validate([
            'order_id' => ['nullable', 'uuid', 'exists:orders,id'],
            'amount' => ['nullable', 'numeric', 'gt:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'description' => ['nullable', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'payment_method_token' => ['nullable', 'string', 'max:255'],
            'metadata' => ['nullable', 'array'],
            'success_url' => ['nullable', 'url'],
            'failure_url' => ['nullable', 'url'],
        ]);

        $order = null;
        if (! empty($validated['order_id'])) {
            $order = Order::query()->findOrFail($validated['order_id']);
        }

        $amount = (float) ($validated['amount'] ?? $order?->total_amount ?? 0);
        if ($amount <= 0) {
            return response()->json(['message' => 'Amount must be greater than zero.'], 422);
        }

        $currency = strtoupper((string) ($validated['currency'] ?? $order?->currency ?? 'USD'));

        $transaction = PaymentTransaction::query()->create([
            'id' => Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'order_id' => $order?->id,
            'status' => 'pending',
            'amount' => $amount,
            'currency' => $currency,
            'refunded_amount' => 0,
            'customer_email' => $validated['customer_email'] ?? null,
            'customer_name' => $validated['customer_name'] ?? null,
            'description' => $validated['description'] ?? "Payment for order {$order?->id}",
            'metadata' => $validated['metadata'] ?? null,
        ]);

        $paymentRequest = PaymentRequestDTO::create([
            'transaction_id' => $transaction->id,
            'tenant_id' => $tenant->id,
            'amount' => $amount,
            'currency' => $currency,
            'description' => $transaction->description ?? 'Store payment',
            'customer_email' => $validated['customer_email'] ?? 'customer@example.com',
            'customer_name' => $validated['customer_name'] ?? 'Customer',
            'payment_method_token' => $validated['payment_method_token'] ?? null,
            'metadata' => $validated['metadata'] ?? [],
            'success_url' => $validated['success_url'] ?? null,
            'failure_url' => $validated['failure_url'] ?? null,
        ]);

        $response = (new PaymentService())->processPayment($paymentRequest);

        $transaction->update([
            'gateway_transaction_id' => $response->gatewayTransactionId,
            'status' => $response->status,
            'error_code' => $response->errorCode,
            'error_message' => $response->success ? null : $response->message,
            'metadata' => array_merge($transaction->metadata ?? [], $response->metadata ?? []),
            'paid_at' => $response->success && $response->status === 'completed' ? now() : null,
        ]);

        if ($response->success && $response->status === 'completed' && $order) {
            DB::transaction(function () use ($order, $tenant): void {
                $from = $order->status;
                $order->status = 'paid';
                $order->save();

                OrderStatusEvent::query()->create([
                    'id' => Str::uuid()->toString(),
                    'order_id' => $order->id,
                    'tenant_id' => $tenant->id,
                    'from_status' => $from,
                    'to_status' => 'paid',
                    'note' => 'Order marked as paid from payment confirmation.',
                ]);
            });
        }

        return response()->json([
            'payment' => $transaction->fresh(),
            'gateway_response' => $response->toArray(),
        ], $response->success ? 201 : 422);
    }

    public function show(string $id): JsonResponse
    {
        $payment = PaymentTransaction::query()->findOrFail($id);
        return response()->json(['payment' => $payment]);
    }

    public function refund(Request $request, string $id): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $payment = PaymentTransaction::query()->findOrFail($id);

        $validated = $request->validate([
            'amount' => ['nullable', 'numeric', 'gt:0'],
            'reason' => ['nullable', 'string', 'max:255'],
            'metadata' => ['nullable', 'array'],
        ]);

        $alreadyRefunded = (float) $payment->refunded_amount;
        $remaining = (float) $payment->amount - $alreadyRefunded;
        $refundAmount = (float) ($validated['amount'] ?? $remaining);

        if ($refundAmount <= 0 || $refundAmount > $remaining) {
            return response()->json(['message' => 'Invalid refund amount.'], 422);
        }

        $refundRequest = RefundRequestDTO::create([
            'refund_id' => (string) Str::uuid(),
            'original_transaction_id' => (string) ($payment->gateway_transaction_id ?? $payment->id),
            'amount' => $refundAmount,
            'reason' => $validated['reason'] ?? null,
            'metadata' => $validated['metadata'] ?? [],
        ]);

        $response = (new PaymentService())->refundPayment($refundRequest, $tenant->id);

        if (! $response->success) {
            $payment->update([
                'status' => 'refund_failed',
                'error_code' => $response->errorCode,
                'error_message' => $response->message,
            ]);

            return response()->json([
                'payment' => $payment->fresh(),
                'refund_response' => $response->toArray(),
            ], 422);
        }

        $newRefundTotal = $alreadyRefunded + $refundAmount;
        $newStatus = $newRefundTotal >= (float) $payment->amount ? 'refunded' : 'partially_refunded';

        $payment->update([
            'refunded_amount' => $newRefundTotal,
            'status' => $newStatus,
            'refunded_at' => now(),
            'error_code' => null,
            'error_message' => null,
        ]);

        return response()->json([
            'payment' => $payment->fresh(),
            'refund_response' => $response->toArray(),
        ]);
    }

    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        $gatewayTransactionId = (string) (
            data_get($payload, 'data.object.id')
            ?? data_get($payload, 'resource.id')
            ?? data_get($payload, 'payload.payment.entity.id')
            ?? ''
        );

        if ($gatewayTransactionId !== '') {
            $status = strtolower((string) (
                data_get($payload, 'data.object.status')
                ?? data_get($payload, 'resource.status')
                ?? data_get($payload, 'payload.payment.entity.status')
                ?? 'pending'
            ));

            PaymentTransaction::query()
                ->where('gateway_transaction_id', $gatewayTransactionId)
                ->update([
                    'status' => $status,
                    'metadata' => $payload,
                    'paid_at' => in_array($status, ['succeeded', 'paid', 'captured', 'completed'], true) ? now() : null,
                ]);
        }

        return response()->json(['status' => 'ok']);
    }
}
