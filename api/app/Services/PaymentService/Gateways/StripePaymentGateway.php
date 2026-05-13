<?php

declare(strict_types=1);

namespace App\Services\PaymentService\Gateways;

use App\Services\PaymentService\Contracts\PaymentGatewayInterface;
use App\Services\PaymentService\DTOs\PaymentRequestDTO;
use App\Services\PaymentService\DTOs\PaymentResponseDTO;
use App\Services\PaymentService\DTOs\RefundRequestDTO;
use App\Services\PaymentService\DTOs\RefundResponseDTO;
use Exception;

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
            if (!$this->isConfigured()) {
                return PaymentResponseDTO::failed(
                    $paymentRequest->transactionId,
                    'Stripe gateway is not properly configured',
                    'STRIPE_NOT_CONFIGURED'
                );
            }

            // TODO: Implement actual Stripe API call
            // This is a placeholder for demonstration
            // In production, use: \Stripe\Charge::create([...])

            return PaymentResponseDTO::success(
                transactionId: $paymentRequest->transactionId,
                gatewayTransactionId: 'ch_stripe_' . uniqid(),
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
            if (!$this->isConfigured()) {
                return RefundResponseDTO::failed(
                    $refundRequest->refundId,
                    $refundRequest->originalTransactionId,
                    'Stripe gateway is not properly configured',
                    'STRIPE_NOT_CONFIGURED'
                );
            }

            // TODO: Implement actual Stripe refund API call
            // In production, use: \Stripe\Refund::create([...])

            return RefundResponseDTO::success(
                refundId: $refundRequest->refundId,
                originalTransactionId: $refundRequest->originalTransactionId,
                gatewayRefundId: 're_stripe_' . uniqid(),
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
            if (!$this->isConfigured()) {
                return PaymentResponseDTO::failed(
                    $transactionId,
                    'Stripe gateway is not properly configured',
                    'STRIPE_NOT_CONFIGURED'
                );
            }

            // TODO: Implement actual Stripe charge retrieve
            // In production, use: \Stripe\Charge::retrieve($transactionId)

            return PaymentResponseDTO::success(
                transactionId: $transactionId,
                gatewayTransactionId: $transactionId,
                amount: 0,
                metadata: [],
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
