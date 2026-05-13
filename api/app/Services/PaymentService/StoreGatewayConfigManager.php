<?php

declare(strict_types=1);

namespace App\Services\PaymentService;

use App\Services\PaymentService\DTOs\StoreGatewayConfigDTO;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * Store Gateway Configuration Manager
 *
 * Handles retrieval and management of store-specific payment gateway
 * configurations. Queries a database to get the OAuth tokens and
 * credentials for each store.
 *
 * This service bridges the gap between multi-tenant store setup and
 * payment gateway operations.
 */
class StoreGatewayConfigManager
{
    /**
     * Get the active payment gateway configuration for a tenant.
     *
    * @param string $tenantId The tenant ID
     * @return StoreGatewayConfigDTO|null The tenant's gateway configuration
     */
    public function getStoreGatewayConfig(string $tenantId): ?StoreGatewayConfigDTO
    {
        $config = DB::table('store_payment_gateways')
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->first();

        if (!$config) {
            return null;
        }

        return $this->mapRowToDTO($config);
    }

    /**
     * Get a specific gateway configuration for a tenant.
     *
    * @param string $tenantId The tenant ID
     * @param string $gatewayName The gateway name (stripe, paypal, razorpay)
     * @return StoreGatewayConfigDTO|null The tenant's specific gateway configuration
     */
    public function getStoreGatewayConfigByName(string $tenantId, string $gatewayName): ?StoreGatewayConfigDTO
    {
        $config = DB::table('store_payment_gateways')
            ->where('tenant_id', $tenantId)
            ->where('gateway', strtolower($gatewayName))
            ->first();

        if (!$config) {
            return null;
        }

        return $this->mapRowToDTO($config);
    }

    /**
    * Store or update a tenant's payment gateway configuration.
     * Called after OAuth authorization flow.
     *
     * @param StoreGatewayConfigDTO $config The configuration to store
     * @return bool Success status
     */
    public function saveStoreGatewayConfig(StoreGatewayConfigDTO $config): bool
    {
        DB::table('store_payment_gateways')->updateOrInsert(
            [
                'tenant_id' => $config->tenantId,
                'gateway' => strtolower($config->gateway),
            ],
            [
                'oauth_token' => $config->oauthToken ? Crypt::encryptString($config->oauthToken) : null,
                'oauth_refresh_token' => $config->oauthRefreshToken ? Crypt::encryptString($config->oauthRefreshToken) : null,
                'gateway_account_id' => $config->gatewayAccountId,
                'is_active' => $config->isActive,
                'connected_at' => now(),
                'metadata' => $config->metadata ? json_encode($config->metadata) : null,
            ]
        );

        return true;
    }

    /**
     * Deactivate a tenant's gateway configuration.
     *
    * @param string $tenantId The tenant ID
     * @param string $gatewayName The gateway name
     * @return bool Success status
     */
    public function deactivateGatewayConfig(string $tenantId, string $gatewayName): bool
    {
        DB::table('store_payment_gateways')
            ->where('tenant_id', $tenantId)
            ->where('gateway', strtolower($gatewayName))
            ->update(['is_active' => false]);

        return true;
    }

    /**
     * Check if a tenant has a valid gateway configuration.
     *
    * @param string $tenantId The tenant ID
     * @param string $gatewayName The gateway name (optional - checks any active gateway if not provided)
     * @return bool Whether the store has a valid configuration
     */
    public function hasValidGatewayConfig(string $tenantId, ?string $gatewayName = null): bool
    {
        if ($gatewayName) {
            $config = $this->getStoreGatewayConfigByName($tenantId, $gatewayName);
        } else {
            $config = $this->getStoreGatewayConfig($tenantId);
        }

        return $config !== null && $config->isActive && !empty($config->oauthToken);
    }

    /**
     * Get all gateway configurations for a tenant.
     *
    * @param string $tenantId The tenant ID
     * @return array Array of StoreGatewayConfigDTO
     */
    public function getStoreAllGatewayConfigs(string $tenantId): array
    {
        $configs = DB::table('store_payment_gateways')
            ->where('tenant_id', $tenantId)
            ->get();

        return $configs->map(fn ($row) => $this->mapRowToDTO($row))->toArray();
    }

    /**
     * Map database row to DTO, decrypting encrypted fields.
     *
     * @param object $row Database row
     * @return StoreGatewayConfigDTO
     */
    private function mapRowToDTO(object $row): StoreGatewayConfigDTO
    {
        return StoreGatewayConfigDTO::create([
            'tenant_id' => $row->tenant_id,
            'gateway' => $row->gateway,
            'is_active' => (bool) $row->is_active,
            'oauth_token' => $row->oauth_token ? Crypt::decryptString($row->oauth_token) : null,
            'oauth_refresh_token' => $row->oauth_refresh_token ? Crypt::decryptString($row->oauth_refresh_token) : null,
            'gateway_account_id' => $row->gateway_account_id,
            'metadata' => $row->metadata ? json_decode($row->metadata, true) : [],
        ]);
    }
}
