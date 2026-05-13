<?php

declare(strict_types=1);

namespace App\Services\PaymentService\DTOs;

/**
 * Data Transfer Object for refund requests.
 */
class RefundRequestDTO
{
    public function __construct(
        public readonly string $refundId,
        public readonly string $originalTransactionId,
        public readonly float $amount,
        public readonly ?string $reason = null,
        public readonly ?array $metadata = [],
    ) {}

    public static function create(array $data): self
    {
        return new self(
            refundId: $data['refund_id'],
            originalTransactionId: $data['original_transaction_id'],
            amount: $data['amount'],
            reason: $data['reason'] ?? null,
            metadata: $data['metadata'] ?? [],
        );
    }

    public function toArray(): array
    {
        return [
            'refund_id' => $this->refundId,
            'original_transaction_id' => $this->originalTransactionId,
            'amount' => $this->amount,
            'reason' => $this->reason,
            'metadata' => $this->metadata,
        ];
    }
}
