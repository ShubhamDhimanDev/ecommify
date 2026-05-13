<?php

declare(strict_types=1);

namespace App\Services\PaymentService\DTOs;

/**
 * Data Transfer Object for payment requests.
 */
class PaymentRequestDTO
{
    public function __construct(
        public readonly string $transactionId,
        public readonly string $tenantId,
        public readonly float $amount,
        public readonly string $currency,
        public readonly string $description,
        public readonly string $customerEmail,
        public readonly string $customerName,
        public readonly ?string $paymentMethodToken = null,
        public readonly ?array $metadata = [],
        public readonly ?string $successUrl = null,
        public readonly ?string $failureUrl = null,
    ) {}

    public static function create(array $data): self
    {
        return new self(
            transactionId: $data['transaction_id'],
            tenantId: $data['tenant_id'],
            amount: $data['amount'],
            currency: $data['currency'] ?? 'USD',
            description: $data['description'],
            customerEmail: $data['customer_email'],
            customerName: $data['customer_name'],
            paymentMethodToken: $data['payment_method_token'] ?? null,
            metadata: $data['metadata'] ?? [],
            successUrl: $data['success_url'] ?? null,
            failureUrl: $data['failure_url'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'tenant_id' => $this->tenantId,
            'transaction_id' => $this->transactionId,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'description' => $this->description,
            'customer_email' => $this->customerEmail,
            'customer_name' => $this->customerName,
            'payment_method_token' => $this->paymentMethodToken,
            'metadata' => $this->metadata,
            'success_url' => $this->successUrl,
            'failure_url' => $this->failureUrl,
        ];
    }
}
