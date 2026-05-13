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
 * PayPal Payment Gateway Implementation.
 * Handles payment processing through PayPal API.
 */
class PayPalPaymentGateway implements PaymentGatewayInterface
{
    private ?string $clientId = null;
    private ?string $clientSecret = null;
    private string $mode;

    public function __construct()
    {
        $this->clientId = config('payment.gateways.paypal.client_id');
        $this->clientSecret = config('payment.gateways.paypal.client_secret');
        $this->mode = (string) config('payment.gateways.paypal.mode', 'sandbox');
    }

    public function charge(PaymentRequestDTO $paymentRequest): PaymentResponseDTO
    {
        try {
            if (! $this->isConfigured()) {
                return PaymentResponseDTO::failed(
                    $paymentRequest->transactionId,
                    'PayPal gateway is not properly configured',
                    'PAYPAL_NOT_CONFIGURED'
                );
            }

            $token = $this->accessToken();
            if (! $token) {
                return PaymentResponseDTO::failed(
                    $paymentRequest->transactionId,
                    'Failed to authenticate with PayPal',
                    'PAYPAL_AUTH_FAILED'
                );
            }

            $response = Http::withToken($token)
                ->post($this->baseUrl().'/v2/checkout/orders', [
                    'intent' => 'CAPTURE',
                    'purchase_units' => [[
                        'reference_id' => $paymentRequest->transactionId,
                        'description' => $paymentRequest->description,
                        'amount' => [
                            'currency_code' => strtoupper($paymentRequest->currency),
                            'value' => number_format($paymentRequest->amount, 2, '.', ''),
                        ],
                    ]],
                    'application_context' => [
                        'return_url' => $paymentRequest->successUrl,
                        'cancel_url' => $paymentRequest->failureUrl,
                    ],
                ]);

            if (! $response->successful()) {
                return PaymentResponseDTO::failed(
                    $paymentRequest->transactionId,
                    (string) ($response->json('message') ?? 'PayPal order creation failed'),
                    'PAYPAL_ORDER_CREATE_FAILED'
                );
            }

            $order = $response->json();
            $status = (string) ($order['status'] ?? 'CREATED');

            if (in_array($status, ['COMPLETED', 'CAPTURED'], true)) {
                return PaymentResponseDTO::success(
                    transactionId: $paymentRequest->transactionId,
                    gatewayTransactionId: (string) ($order['id'] ?? ''),
                    amount: $paymentRequest->amount,
                    currency: strtoupper($paymentRequest->currency),
                    metadata: $order,
                );
            }

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
                'PAYPAL_ERROR'
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
                    'PayPal gateway is not properly configured',
                    'PAYPAL_NOT_CONFIGURED'
                );
            }

            $token = $this->accessToken();
            if (! $token) {
                return RefundResponseDTO::failed(
                    $refundRequest->refundId,
                    $refundRequest->originalTransactionId,
                    'Failed to authenticate with PayPal',
                    'PAYPAL_AUTH_FAILED'
                );
            }

            $response = Http::withToken($token)
                ->post($this->baseUrl()."/v2/payments/captures/{$refundRequest->originalTransactionId}/refund", [
                    'amount' => [
                        'value' => number_format($refundRequest->amount, 2, '.', ''),
                        'currency_code' => 'USD',
                    ],
                    'note_to_payer' => $refundRequest->reason,
                ]);

            if (! $response->successful()) {
                return RefundResponseDTO::failed(
                    $refundRequest->refundId,
                    $refundRequest->originalTransactionId,
                    (string) ($response->json('message') ?? 'PayPal refund failed'),
                    'PAYPAL_REFUND_FAILED'
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
                'PAYPAL_ERROR'
            );
        }
    }

    public function verify(string $transactionId): PaymentResponseDTO
    {
        try {
            if (! $this->isConfigured()) {
                return PaymentResponseDTO::failed(
                    $transactionId,
                    'PayPal gateway is not properly configured',
                    'PAYPAL_NOT_CONFIGURED'
                );
            }

            $token = $this->accessToken();
            if (! $token) {
                return PaymentResponseDTO::failed(
                    $transactionId,
                    'Failed to authenticate with PayPal',
                    'PAYPAL_AUTH_FAILED'
                );
            }

            $response = Http::withToken($token)
                ->get($this->baseUrl()."/v2/checkout/orders/{$transactionId}");

            if (! $response->successful()) {
                return PaymentResponseDTO::failed(
                    $transactionId,
                    (string) ($response->json('message') ?? 'PayPal transaction lookup failed'),
                    'PAYPAL_VERIFY_FAILED'
                );
            }

            $order = $response->json();
            $status = (string) ($order['status'] ?? 'CREATED');

            if (in_array($status, ['COMPLETED', 'CAPTURED'], true)) {
                return PaymentResponseDTO::success(
                    transactionId: $transactionId,
                    gatewayTransactionId: $transactionId,
                    amount: (float) ($order['purchase_units'][0]['amount']['value'] ?? 0),
                    currency: (string) ($order['purchase_units'][0]['amount']['currency_code'] ?? 'USD'),
                    metadata: $order,
                );
            }

            return PaymentResponseDTO::pending(
                transactionId: $transactionId,
                gatewayTransactionId: $transactionId,
                amount: (float) ($order['purchase_units'][0]['amount']['value'] ?? 0),
                currency: (string) ($order['purchase_units'][0]['amount']['currency_code'] ?? 'USD'),
                metadata: $order,
            );
        } catch (Exception $e) {
            return PaymentResponseDTO::failed(
                $transactionId,
                $e->getMessage(),
                'PAYPAL_ERROR'
            );
        }
    }

    public function isConfigured(): bool
    {
        return !empty($this->clientId) && !empty($this->clientSecret);
    }

    public function getGatewayName(): string
    {
        return 'paypal';
    }

    private function baseUrl(): string
    {
        return $this->mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    }

    private function accessToken(): ?string
    {
        $response = Http::asForm()
            ->withBasicAuth((string) $this->clientId, (string) $this->clientSecret)
            ->post($this->baseUrl().'/v1/oauth2/token', [
                'grant_type' => 'client_credentials',
            ]);

        if (! $response->successful()) {
            return null;
        }

        return $response->json('access_token');
    }
}
