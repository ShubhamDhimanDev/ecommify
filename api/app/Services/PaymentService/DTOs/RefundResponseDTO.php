<?php

declare(strict_types=1);

namespace App\Services\PaymentService\DTOs;

use Carbon\Carbon;

/**
 * Data Transfer Object for refund responses.
 */
class RefundResponseDTO
{
    public function __construct(
        public readonly bool $success,
        public readonly string $refundId,
        public readonly string $originalTransactionId,
        public readonly ?string $gatewayRefundId = null,
        public readonly string $status = 'pending',
        public readonly float $amount = 0,
        public readonly ?string $message = null,
        public readonly ?string $errorCode = null,
        public readonly ?Carbon $processedAt = null,
        public readonly ?array $metadata = [],
    ) {}

    public static function success(
        string $refundId,
        string $originalTransactionId,
        string $gatewayRefundId,
        float $amount,
        ?array $metadata = [],
    ): self {
        return new self(
            success: true,
            refundId: $refundId,
            originalTransactionId: $originalTransactionId,
            gatewayRefundId: $gatewayRefundId,
            status: 'completed',
            amount: $amount,
            message: 'Refund processed successfully',
            processedAt: Carbon::now(),
            metadata: $metadata,
        );
    }

    public static function failed(
        string $refundId,
        string $originalTransactionId,
        string $message,
        ?string $errorCode = null,
        ?array $metadata = [],
    ): self {
        return new self(
            success: false,
            refundId: $refundId,
            originalTransactionId: $originalTransactionId,
            status: 'failed',
            message: $message,
            errorCode: $errorCode,
            processedAt: Carbon::now(),
            metadata: $metadata,
        );
    }

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'refund_id' => $this->refundId,
            'original_transaction_id' => $this->originalTransactionId,
            'gateway_refund_id' => $this->gatewayRefundId,
            'status' => $this->status,
            'amount' => $this->amount,
            'message' => $this->message,
            'error_code' => $this->errorCode,
            'processed_at' => $this->processedAt?->toIso8601String(),
            'metadata' => $this->metadata,
        ];
    }
}
