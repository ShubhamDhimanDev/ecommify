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
 * Stripe Payment Gateway Implementation.
 * Handles payment processing through Stripe API.
 */
class StripePaymentGateway implements PaymentGatewayInterface
{
    private ?string $apiKey = null;

    public function __construct()
    {
        $this->apiKey = config('payment.gateways.stripe.secret_key');
    }

    public function charge(PaymentRequestDTO $paymentRequest): PaymentResponseDTO
    {
        try {
            if (! $this->isConfigured()) {
                return PaymentResponseDTO::failed(
                    $paymentRequest->transactionId,
                    'Stripe gateway is not properly configured',
                    'STRIPE_NOT_CONFIGURED'
                );
            }

            $payload = [
                'amount' => (int) round($paymentRequest->amount * 100),
                'currency' => strtolower($paymentRequest->currency),
                'description' => $paymentRequest->description,
            ];

            foreach ($paymentRequest->metadata ?? [] as $key => $value) {
                $payload["metadata[{$key}]"] = is_scalar($value) ? (string) $value : json_encode($value);
            }

            if (! empty($paymentRequest->paymentMethodToken)) {
                $payload['payment_method'] = $paymentRequest->paymentMethodToken;
                $payload['confirm'] = 'true';
                $payload['off_session'] = 'true';
            }

            $response = Http::asForm()
                ->withToken((string) $this->apiKey)
                ->post('https://api.stripe.com/v1/payment_intents', $payload);

            if (! $response->successful()) {
                return PaymentResponseDTO::failed(
                    $paymentRequest->transactionId,
                    (string) ($response->json('error.message') ?? 'Stripe payment intent creation failed'),
                    (string) ($response->json('error.code') ?? 'STRIPE_REQUEST_FAILED')
                );
            }

            $intent = $response->json();
            $gatewayId = (string) ($intent['id'] ?? '');
            $status = (string) ($intent['status'] ?? 'pending');
            $processedAmount = ((float) ($intent['amount_received'] ?? $intent['amount'] ?? 0)) / 100;

            if ($status === 'succeeded') {
                return PaymentResponseDTO::success(
                    transactionId: $paymentRequest->transactionId,
                    gatewayTransactionId: $gatewayId,
                    amount: $processedAmount > 0 ? $processedAmount : $paymentRequest->amount,
                    currency: strtoupper((string) ($intent['currency'] ?? $paymentRequest->currency)),
                    metadata: $paymentRequest->metadata,
                );
            }

            return PaymentResponseDTO::pending(
                transactionId: $paymentRequest->transactionId,
                gatewayTransactionId: $gatewayId,
                amount: $paymentRequest->amount,
                currency: $paymentRequest->currency,
                metadata: $paymentRequest->metadata,
            );
        } catch (Exception $e) {
            return PaymentResponseDTO::failed(
                $paymentRequest->transactionId,
                $e->getMessage(),
                'STRIPE_ERROR'
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
                    'Stripe gateway is not properly configured',
                    'STRIPE_NOT_CONFIGURED'
                );
            }

            $paramKey = str_starts_with($refundRequest->originalTransactionId, 'pi_') ? 'payment_intent' : 'charge';

            $response = Http::asForm()
                ->withToken((string) $this->apiKey)
                ->post('https://api.stripe.com/v1/refunds', [
                    $paramKey => $refundRequest->originalTransactionId,
                    'amount' => (int) round($refundRequest->amount * 100),
                    'metadata[source_refund_id]' => $refundRequest->refundId,
                ]);

            if (! $response->successful()) {
                return RefundResponseDTO::failed(
                    $refundRequest->refundId,
                    $refundRequest->originalTransactionId,
                    (string) ($response->json('error.message') ?? 'Stripe refund failed'),
                    (string) ($response->json('error.code') ?? 'STRIPE_REFUND_FAILED')
                );
            }

            $refund = $response->json();

            return RefundResponseDTO::success(
                refundId: $refundRequest->refundId,
                originalTransactionId: $refundRequest->originalTransactionId,
                gatewayRefundId: (string) ($refund['id'] ?? ''),
                amount: $refundRequest->amount,
                metadata: $refundRequest->metadata,
            );
        } catch (Exception $e) {
            return RefundResponseDTO::failed(
                $refundRequest->refundId,
                $refundRequest->originalTransactionId,
                $e->getMessage(),
                'STRIPE_ERROR'
            );
        }
    }

    public function verify(string $transactionId): PaymentResponseDTO
    {
        try {
            if (! $this->isConfigured()) {
                return PaymentResponseDTO::failed(
                    $transactionId,
                    'Stripe gateway is not properly configured',
                    'STRIPE_NOT_CONFIGURED'
                );
            }

            $response = Http::withToken((string) $this->apiKey)
                ->get("https://api.stripe.com/v1/payment_intents/{$transactionId}");

            if (! $response->successful()) {
                return PaymentResponseDTO::failed(
                    $transactionId,
                    (string) ($response->json('error.message') ?? 'Stripe payment lookup failed'),
                    (string) ($response->json('error.code') ?? 'STRIPE_VERIFY_FAILED')
                );
            }

            $intent = $response->json();
            $status = (string) ($intent['status'] ?? 'pending');

            if ($status === 'succeeded') {
                return PaymentResponseDTO::success(
                    transactionId: $transactionId,
                    gatewayTransactionId: (string) ($intent['id'] ?? $transactionId),
                    amount: ((float) ($intent['amount_received'] ?? $intent['amount'] ?? 0)) / 100,
                    currency: strtoupper((string) ($intent['currency'] ?? 'USD')),
                    metadata: $intent,
                );
            }

            return PaymentResponseDTO::pending(
                transactionId: $transactionId,
                gatewayTransactionId: (string) ($intent['id'] ?? $transactionId),
                amount: ((float) ($intent['amount'] ?? 0)) / 100,
                currency: strtoupper((string) ($intent['currency'] ?? 'USD')),
                metadata: $intent,
            );
        } catch (Exception $e) {
            return PaymentResponseDTO::failed(
                $transactionId,
                $e->getMessage(),
                'STRIPE_ERROR'
            );
        }
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    public function getGatewayName(): string
    {
        return 'stripe';
    }
}
