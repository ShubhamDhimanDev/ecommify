<?php

declare(strict_types=1);

namespace App\Services\PaymentService\Contracts;

use App\Services\PaymentService\DTOs\PaymentRequestDTO;
use App\Services\PaymentService\DTOs\PaymentResponseDTO;
use App\Services\PaymentService\DTOs\RefundRequestDTO;
use App\Services\PaymentService\DTOs\RefundResponseDTO;

/**
 * Contract for all payment gateway implementations.
 * Any new payment gateway must implement this interface.
 */
interface PaymentGatewayInterface
{
    /**
     * Process a payment transaction.
     */
    public function charge(PaymentRequestDTO $paymentRequest): PaymentResponseDTO;

    /**
     * Refund a payment transaction.
     */
    public function refund(RefundRequestDTO $refundRequest): RefundResponseDTO;

    /**
     * Verify the status of a payment.
     */
    public function verify(string $transactionId): PaymentResponseDTO;

    /**
     * Validate if the gateway is properly configured.
     */
    public function isConfigured(): bool;

    /**
     * Get the gateway name.
     */
    public function getGatewayName(): string;
}
