<?php

declare(strict_types=1);

namespace App\Services\PaymentService\Gateways;

use App\Services\PaymentService\Contracts\PaymentGatewayInterface;
use App\Services\PaymentService\DTOs\PaymentRequestDTO;
use App\Services\PaymentService\DTOs\PaymentResponseDTO;
use App\Services\PaymentService\DTOs\RefundRequestDTO;
use App\Services\PaymentService\DTOs\RefundResponseDTO;
use Exception;
use Illuminate\Support\Facades\Http;

/**
 * Razorpay Payment Gateway Implementation.
 * Handles payment processing through Razorpay API.
 */
class RazorpayPaymentGateway implements PaymentGatewayInterface
{
    private ?string $keyId = null;
    private ?string $keySecret = null;

    public function __construct()
    {
        $this->keyId = config('payment.gateways.razorpay.key_id');
        $this->keySecret = config('payment.gateways.razorpay.key_secret');
    }

    public function charge(PaymentRequestDTO $paymentRequest): PaymentResponseDTO
    {
        try {
            if (! $this->isConfigured()) {
                return PaymentResponseDTO::failed(
                    $paymentRequest->transactionId,
                    'Razorpay gateway is not properly configured',
                    'RAZORPAY_NOT_CONFIGURED'
                );
            }

            $response = Http::withBasicAuth((string) $this->keyId, (string) $this->keySecret)
                ->post('https://api.razorpay.com/v1/orders', [
                    'amount' => (int) round($paymentRequest->amount * 100),
                    'currency' => strtoupper($paymentRequest->currency),
                    'receipt' => $paymentRequest->transactionId,
                    'notes' => $paymentRequest->metadata ?? [],
                ]);

            if (! $response->successful()) {
                return PaymentResponseDTO::failed(
                    $paymentRequest->transactionId,
                    (string) ($response->json('error.description') ?? 'Razorpay order creation failed'),
                    'RAZORPAY_ORDER_CREATE_FAILED'
                );
            }

            $order = $response->json();

            return PaymentResponseDTO::pending(
                transactionId: $paymentRequest->transactionId,
                gatewayTransactionId: (string) ($order['id'] ?? ''),
                amount: $paymentRequest->amount,
                currency: $paymentRequest->currency,
                metadata: $order,
            );
        } catch (Exception $e) {
            return PaymentResponseDTO::failed(
                $paymentRequest->transactionId,
                $e->getMessage(),
                'RAZORPAY_ERROR'
            );
        }
    }

    public function refund(RefundRequestDTO $refundRequest): RefundResponseDTO
    {
        try {
            if (! $this->isConfigured()) {
                return RefundResponseDTO::failed(
                    $refundRequest->refundId,
                    $refundRequest->originalTransactionId,
                    'Razorpay gateway is not properly configured',
                    'RAZORPAY_NOT_CONFIGURED'
                );
            }

            $response = Http::withBasicAuth((string) $this->keyId, (string) $this->keySecret)
                ->post("https://api.razorpay.com/v1/payments/{$refundRequest->originalTransactionId}/refund", [
                    'amount' => (int) round($refundRequest->amount * 100),
                    'notes' => array_filter([
                        'reason' => $refundRequest->reason,
                        'source_refund_id' => $refundRequest->refundId,
                    ]),
                ]);

            if (! $response->successful()) {
                return RefundResponseDTO::failed(
                    $refundRequest->refundId,
                    $refundRequest->originalTransactionId,
                    (string) ($response->json('error.description') ?? 'Razorpay refund failed'),
                    'RAZORPAY_REFUND_FAILED'
                );
            }

            $refund = $response->json();

            return RefundResponseDTO::success(
                refundId: $refundRequest->refundId,
                originalTransactionId: $refundRequest->originalTransactionId,
                gatewayRefundId: (string) ($refund['id'] ?? ''),
                amount: $refundRequest->amount,
                metadata: $refund,
            );
        } catch (Exception $e) {
            return RefundResponseDTO::failed(
                $refundRequest->refundId,
                $refundRequest->originalTransactionId,
                $e->getMessage(),
                'RAZORPAY_ERROR'
            );
        }
    }

    public function verify(string $transactionId): PaymentResponseDTO
    {
        try {
            if (! $this->isConfigured()) {
                return PaymentResponseDTO::failed(
                    $transactionId,
                    'Razorpay gateway is not properly configured',
                    'RAZORPAY_NOT_CONFIGURED'
                );
            }

            $response = Http::withBasicAuth((string) $this->keyId, (string) $this->keySecret)
                ->get("https://api.razorpay.com/v1/payments/{$transactionId}");

            if (! $response->successful()) {
                return PaymentResponseDTO::failed(
                    $transactionId,
                    (string) ($response->json('error.description') ?? 'Razorpay payment lookup failed'),
                    'RAZORPAY_VERIFY_FAILED'
                );
            }

            $payment = $response->json();
            $captured = (bool) ($payment['captured'] ?? false);

            if ($captured) {
                return PaymentResponseDTO::success(
                    transactionId: $transactionId,
                    gatewayTransactionId: (string) ($payment['id'] ?? $transactionId),
                    amount: ((float) ($payment['amount'] ?? 0)) / 100,
                    currency: strtoupper((string) ($payment['currency'] ?? 'USD')),
                    metadata: $payment,
                );
            }

            return PaymentResponseDTO::pending(
                transactionId: $transactionId,
                gatewayTransactionId: (string) ($payment['id'] ?? $transactionId),
                amount: ((float) ($payment['amount'] ?? 0)) / 100,
                currency: strtoupper((string) ($payment['currency'] ?? 'USD')),
                metadata: $payment,
            );
        } catch (Exception $e) {
            return PaymentResponseDTO::failed(
                $transactionId,
                $e->getMessage(),
                'RAZORPAY_ERROR'
            );
        }
    }

    public function isConfigured(): bool
    {
        return !empty($this->keyId) && !empty($this->keySecret);
    }

    public function getGatewayName(): string
    {
        return 'razorpay';
    }
}
