<?php

declare(strict_types=1);

namespace App\Services\PaymentService;

use App\Services\PaymentService\Contracts\PaymentGatewayInterface;
use App\Services\PaymentService\DTOs\PaymentRequestDTO;
use App\Services\PaymentService\DTOs\PaymentResponseDTO;
use App\Services\PaymentService\DTOs\RefundRequestDTO;
use App\Services\PaymentService\DTOs\RefundResponseDTO;

/**
 * PaymentService - Main orchestrator for payment operations.
 *
 * This service acts as a facade for all payment gateway operations,
 * allowing the rest of the application to work with payments in a
 * gateway-agnostic way.
 *
 * Usage:
 *   $service = new PaymentService('stripe');
 *   $response = $service->processPayment($paymentRequest);
 */
class PaymentService
{
    private PaymentGatewayInterface $gateway;
    private StoreGatewayConfigManager $configManager;

    /**
     * Initialize the payment service.
     *
     * @param string $gatewayName Optional gateway name. If provided, uses this globally.
     *                             If not provided, gateway is determined per-store from OAuth config.
     */
    public function __construct(string $gatewayName = null)
    {
        $this->configManager = new StoreGatewayConfigManager();

        if ($gatewayName) {
            $gatewayName = config('payment.default_gateway', $gatewayName);
            $this->gateway = PaymentGatewayFactory::create($gatewayName);
        }
    }

    /**
     * Process a payment charge using the store's configured gateway.
     *
     * The store's payment gateway is determined from their OAuth connection.
     * This ensures each store uses their own payment account.
     *
      * @param PaymentRequestDTO $paymentRequest The payment request details (includes tenant_id)
     * @return PaymentResponseDTO The payment response
     */
    public function processPayment(PaymentRequestDTO $paymentRequest): PaymentResponseDTO
    {
          $storeConfig = $this->configManager->getStoreGatewayConfig($paymentRequest->tenantId);

        if (! $storeConfig || ! $storeConfig->isActive) {
            return PaymentResponseDTO::failed(
                $paymentRequest->transactionId,
                "Store's payment gateway is not configured or inactive",
                'STORE_GATEWAY_INVALID'
            );
        }

        try {
            $gateway = PaymentGatewayFactory::create($storeConfig->gateway);
        } catch (\InvalidArgumentException $e) {
            return PaymentResponseDTO::failed(
                $paymentRequest->transactionId,
                "Invalid gateway configured for store: {$e->getMessage()}",
                'INVALID_STORE_GATEWAY'
            );
        }

        if (! $gateway->isConfigured()) {
            return PaymentResponseDTO::failed(
                $paymentRequest->transactionId,
                "Payment gateway is not properly configured for this store",
                'GATEWAY_NOT_CONFIGURED'
            );
        }

        return $gateway->charge($paymentRequest);
    }

    /**
     * Refund a payment.
     *
     * @param RefundRequestDTO $refundRequest The refund request details
     * @param string $tenantId The tenant ID
     * @return RefundResponseDTO The refund response
     */
    public function refundPayment(RefundRequestDTO $refundRequest, string $tenantId): RefundResponseDTO
    {
        $storeConfig = $this->configManager->getStoreGatewayConfig($tenantId);

        if (! $storeConfig || ! $storeConfig->isActive) {
            return RefundResponseDTO::failed(
                $refundRequest->refundId,
                $refundRequest->originalTransactionId,
                "Store's payment gateway is not configured or inactive",
                'STORE_GATEWAY_INVALID'
            );
        }

        try {
            $gateway = PaymentGatewayFactory::create($storeConfig->gateway);
        } catch (\InvalidArgumentException $e) {
            return RefundResponseDTO::failed(
                $refundRequest->refundId,
                $refundRequest->originalTransactionId,
                "Invalid gateway configured for store",
                'INVALID_STORE_GATEWAY'
            );
        }

        return $gateway->refund($refundRequest);
    }

    /**
     * Verify a payment status using the store's configured gateway.
     *
     * @param string $transactionId The transaction ID to verify
     * @param string $tenantId The tenant ID
     * @return PaymentResponseDTO The verification result
     */
    public function verifyPayment(string $transactionId, string $tenantId): PaymentResponseDTO
    {
        $storeConfig = $this->configManager->getStoreGatewayConfig($tenantId);

        if (! $storeConfig || ! $storeConfig->isActive) {
            return PaymentResponseDTO::failed(
                $transactionId,
                "Store's payment gateway is not configured or inactive",
                'STORE_GATEWAY_INVALID'
            );
        }

        try {
            $gateway = PaymentGatewayFactory::create($storeConfig->gateway);
        } catch (\InvalidArgumentException $e) {
            return PaymentResponseDTO::failed(
                $transactionId,
                "Invalid gateway configured for store",
                'INVALID_STORE_GATEWAY'
            );
        }

        return $gateway->verify($transactionId);
    }

    /**
     * Switch global gateway mode.
     */
    public function switchGateway(string $gatewayName): void
    {
        $this->gateway = PaymentGatewayFactory::create($gatewayName);
    }

    /**
     * Get the store configuration manager.
     */
    public function getConfigManager(): StoreGatewayConfigManager
    {
        return $this->configManager;
    }

    /**
     * Check if the current gateway is configured.
     */
    public function isGatewayConfigured(): bool
    {
        if (! isset($this->gateway)) {
            return false;
        }

        return $this->gateway->isConfigured();
    }

    /**
     * Get the current gateway name.
     */
    public function getGatewayName(): string
    {
        if (! isset($this->gateway)) {
            return 'none';
        }

        return $this->gateway->getGatewayName();
    }

    /**
     * Get all available gateways.
     */
    public static function getAvailableGateways(): array
    {
        return PaymentGatewayFactory::getAvailableGateways();
    }
}
