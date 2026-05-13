<?php

declare(strict_types=1);

namespace App\Services\PaymentService\DTOs;

use Carbon\Carbon;

/**
 * Data Transfer Object for payment responses.
 */
class PaymentResponseDTO
{
    public function __construct(
        public readonly bool $success,
        public readonly string $transactionId,
        public readonly ?string $gatewayTransactionId = null,
        public readonly string $status = 'pending',
        public readonly float $amount = 0,
        public readonly string $currency = 'USD',
        public readonly ?string $message = null,
        public readonly ?string $errorCode = null,
        public readonly ?Carbon $processedAt = null,
        public readonly ?array $metadata = [],
    ) {}

    public static function success(
        string $transactionId,
        string $gatewayTransactionId,
        float $amount,
        string $currency = 'USD',
        ?array $metadata = [],
    ): self {
        return new self(
            success: true,
            transactionId: $transactionId,
            gatewayTransactionId: $gatewayTransactionId,
            status: 'completed',
            amount: $amount,
            currency: $currency,
            message: 'Payment processed successfully',
            processedAt: Carbon::now(),
            metadata: $metadata,
        );
    }

    public static function failed(
        string $transactionId,
        string $message,
        ?string $errorCode = null,
        ?array $metadata = [],
    ): self {
        return new self(
            success: false,
            transactionId: $transactionId,
            status: 'failed',
            message: $message,
            errorCode: $errorCode,
            processedAt: Carbon::now(),
            metadata: $metadata,
        );
    }

    public static function pending(
        string $transactionId,
        string $gatewayTransactionId,
        float $amount,
        string $currency = 'USD',
        ?array $metadata = [],
    ): self {
        return new self(
            success: true,
            transactionId: $transactionId,
            gatewayTransactionId: $gatewayTransactionId,
            status: 'pending',
            amount: $amount,
            currency: $currency,
            message: 'Payment is pending',
            metadata: $metadata,
        );
    }

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'transaction_id' => $this->transactionId,
            'gateway_transaction_id' => $this->gatewayTransactionId,
            'status' => $this->status,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'message' => $this->message,
            'error_code' => $this->errorCode,
            'processed_at' => $this->processedAt?->toIso8601String(),
            'metadata' => $this->metadata,
        ];
    }
}
