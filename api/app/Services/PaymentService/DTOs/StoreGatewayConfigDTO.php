<?php

declare(strict_types=1);

namespace App\Services\PaymentService\DTOs;

/**
 * Data Transfer Object for store payment gateway configuration.
 * Represents a store's connected payment gateway with OAuth credentials.
 */
class StoreGatewayConfigDTO
{
    public function __construct(
        public readonly string $tenantId,
        public readonly string $gateway,
        public readonly bool $isActive,
        public readonly ?string $oauthToken = null,
        public readonly ?string $oauthRefreshToken = null,
        public readonly ?string $gatewayAccountId = null,
        public readonly ?array $metadata = [],
    ) {}

    public static function create(array $data): self
    {
        return new self(
            tenantId: $data['tenant_id'],
            gateway: $data['gateway'],
            isActive: $data['is_active'] ?? true,
            oauthToken: $data['oauth_token'] ?? null,
            oauthRefreshToken: $data['oauth_refresh_token'] ?? null,
            gatewayAccountId: $data['gateway_account_id'] ?? null,
            metadata: $data['metadata'] ?? [],
        );
    }

    public function toArray(): array
    {
        return [
            'tenant_id' => $this->tenantId,
            'gateway' => $this->gateway,
            'is_active' => $this->isActive,
            'oauth_token' => $this->oauthToken,
            'oauth_refresh_token' => $this->oauthRefreshToken,
            'gateway_account_id' => $this->gatewayAccountId,
            'metadata' => $this->metadata,
        ];
    }
}
