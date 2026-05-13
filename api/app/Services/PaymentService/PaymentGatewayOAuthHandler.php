<?php

declare(strict_types=1);

namespace App\Services\PaymentService;

use App\Services\PaymentService\DTOs\StoreGatewayConfigDTO;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * OAuth Flow Handler for Store Payment Gateway Connection
 *
 * Manages the OAuth authorization flow for stores to connect their
 * payment gateway accounts (Stripe, Razorpay, PayPal, etc.).
 *
 * Workflow:
 * 1. Store requests to connect payment gateway
 * 2. Generate authorization URL for the payment gateway
 * 3. Store is redirected to OAuth provider (Stripe, etc.)
 * 4. Store authorizes and is redirected back with auth code
 * 5. Exchange auth code for OAuth tokens
 * 6. Store store's OAuth tokens in database
 */
class PaymentGatewayOAuthHandler
{
    private StoreGatewayConfigManager $configManager;

    public function __construct()
    {
        $this->configManager = new StoreGatewayConfigManager();
    }

    /**
     * Generate OAuth authorization URL for a store to connect a payment gateway.
     *
    * @param string $tenantId The tenant ID
     * @param string $gatewayName The payment gateway name (stripe, razorpay, paypal)
     * @param string $redirectUrl Where to redirect after OAuth (your callback endpoint)
     * @return string The OAuth authorization URL
     * @throws \InvalidArgumentException If gateway is not supported
     */
    public function generateAuthorizationUrl(string $tenantId, string $gatewayName, string $redirectUrl): string
    {
        $gatewayName = strtolower($gatewayName);

        return match ($gatewayName) {
            'stripe' => $this->generateStripeAuthUrl($tenantId, $redirectUrl),
            'razorpay' => $this->generateRazorpayAuthUrl($tenantId, $redirectUrl),
            'paypal' => $this->generatePayPalAuthUrl($tenantId, $redirectUrl),
            default => throw new \InvalidArgumentException("Unsupported gateway: {$gatewayName}"),
        };
    }

    /**
     * Handle OAuth callback after store authorizes the payment gateway.
     *
     * This is called when the OAuth provider redirects back to your app
     * with an authorization code.
     *
    * @param string $tenantId The tenant ID
     * @param string $gatewayName The payment gateway name
     * @param string $authorizationCode The code returned by OAuth provider
     * @return StoreGatewayConfigDTO|null The saved configuration, or null on failure
     */
    public function handleOAuthCallback(string $tenantId, string $gatewayName, string $authorizationCode): ?StoreGatewayConfigDTO
    {
        $gatewayName = strtolower($gatewayName);

        return match ($gatewayName) {
            'stripe' => $this->handleStripeCallback($tenantId, $authorizationCode),
            'razorpay' => $this->handleRazorpayCallback($tenantId, $authorizationCode),
            'paypal' => $this->handlePayPalCallback($tenantId, $authorizationCode),
            default => null,
        };
    }

    /**
     * Generate Stripe OAuth authorization URL.
     *
    * @param string $tenantId
     * @param string $redirectUrl
     * @return string
     */
    private function generateStripeAuthUrl(string $tenantId, string $redirectUrl): string
    {
        $state = Crypt::encryptString("tenant_id:{$tenantId}");

        return sprintf(
            'https://connect.stripe.com/oauth/authorize?client_id=%s&state=%s&redirect_uri=%s&scope=%s',
            config('payment.gateways.stripe.oauth_client_id'),
            urlencode($state),
            urlencode($redirectUrl),
            'read_write'
        );
    }

    /**
     * Handle Stripe OAuth callback.
     *
    * @param string $tenantId
     * @param string $authorizationCode
     * @return StoreGatewayConfigDTO|null
     */
    private function handleStripeCallback(string $tenantId, string $authorizationCode): ?StoreGatewayConfigDTO
    {
        try {
            $response = Http::post('https://connect.stripe.com/oauth/token', [
                'client_id' => config('payment.gateways.stripe.oauth_client_id'),
                'client_secret' => config('payment.gateways.stripe.oauth_secret'),
                'code' => $authorizationCode,
                'grant_type' => 'authorization_code',
            ]);

            if (!$response->successful()) {
                Log::error('Stripe OAuth token exchange failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();

            return StoreGatewayConfigDTO::create([
                'tenant_id' => $tenantId,
                'gateway' => 'stripe',
                'is_active' => true,
                'oauth_token' => $data['access_token'] ?? null,
                'oauth_refresh_token' => null, // Stripe doesn't return refresh token in standard flow
                'gateway_account_id' => $data['stripe_user_id'] ?? null,
                'metadata' => [
                    'account_type' => $data['stripe_user_id'] ?? null,
                    'livemode' => $data['livemode'] ?? false,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Stripe OAuth callback error', [
                'error' => $e->getMessage(),
                'tenant_id' => $tenantId,
            ]);
            return null;
        }
    }

    /**
     * Generate Razorpay OAuth authorization URL.
     *
    * @param string $tenantId
     * @param string $redirectUrl
     * @return string
     */
    private function generateRazorpayAuthUrl(string $tenantId, string $redirectUrl): string
    {
        $state = Crypt::encryptString("tenant_id:{$tenantId}");

        return sprintf(
            'https://auth.razorpay.com/oauth/authorize?client_id=%s&scope=%s&redirect_uri=%s&state=%s&response_type=%s',
            config('payment.gateways.razorpay.oauth_client_id'),
            'read_write',
            urlencode($redirectUrl),
            urlencode($state),
            'code'
        );
    }

    /**
     * Handle Razorpay OAuth callback.
     *
    * @param string $tenantId
     * @param string $authorizationCode
     * @return StoreGatewayConfigDTO|null
     */
    private function handleRazorpayCallback(string $tenantId, string $authorizationCode): ?StoreGatewayConfigDTO
    {
        try {
            $response = Http::post('https://auth.razorpay.com/oauth/token', [
                'client_id' => config('payment.gateways.razorpay.oauth_client_id'),
                'client_secret' => config('payment.gateways.razorpay.oauth_secret'),
                'code' => $authorizationCode,
                'grant_type' => 'authorization_code',
            ]);

            if (!$response->successful()) {
                Log::error('Razorpay OAuth token exchange failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();

            return StoreGatewayConfigDTO::create([
                'tenant_id' => $tenantId,
                'gateway' => 'razorpay',
                'is_active' => true,
                'oauth_token' => $data['access_token'] ?? null,
                'oauth_refresh_token' => $data['refresh_token'] ?? null,
                'gateway_account_id' => $data['razorpay_account_id'] ?? null,
                'metadata' => [
                    'token_type' => $data['token_type'] ?? 'Bearer',
                    'expires_in' => $data['expires_in'] ?? null,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Razorpay OAuth callback error', [
                'error' => $e->getMessage(),
                'tenant_id' => $tenantId,
            ]);
            return null;
        }
    }

    /**
     * Generate PayPal OAuth authorization URL.
     *
    * @param string $tenantId
     * @param string $redirectUrl
     * @return string
     */
    private function generatePayPalAuthUrl(string $tenantId, string $redirectUrl): string
    {
        $state = Crypt::encryptString("tenant_id:{$tenantId}");

        return sprintf(
            'https://www.paypal.com/connect?client_id=%s&response_type=%s&scope=%s&redirect_uri=%s&state=%s',
            config('payment.gateways.paypal.oauth_client_id'),
            'code',
            urlencode('https://www.paypal.com/webapps/auth/identity/user/xprofile'),
            urlencode($redirectUrl),
            urlencode($state)
        );
    }

    /**
     * Handle PayPal OAuth callback.
     *
    * @param string $tenantId
     * @param string $authorizationCode
     * @return StoreGatewayConfigDTO|null
     */
    private function handlePayPalCallback(string $tenantId, string $authorizationCode): ?StoreGatewayConfigDTO
    {
        try {
            $response = Http::withBasicAuth(
                config('payment.gateways.paypal.oauth_client_id'),
                config('payment.gateways.paypal.oauth_secret')
            )->post('https://api.paypal.com/v1/oauth2/token', [
                'code' => $authorizationCode,
                'grant_type' => 'authorization_code',
            ]);

            if (!$response->successful()) {
                Log::error('PayPal OAuth token exchange failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();

            return StoreGatewayConfigDTO::create([
                'tenant_id' => $tenantId,
                'gateway' => 'paypal',
                'is_active' => true,
                'oauth_token' => $data['access_token'] ?? null,
                'oauth_refresh_token' => $data['refresh_token'] ?? null,
                'gateway_account_id' => null, // Can be retrieved from additional API call
                'metadata' => [
                    'token_type' => $data['token_type'] ?? 'Bearer',
                    'expires_in' => $data['expires_in'] ?? null,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('PayPal OAuth callback error', [
                'error' => $e->getMessage(),
                'tenant_id' => $tenantId,
            ]);
            return null;
        }
    }

    /**
     * Refresh an expired OAuth token for a store.
     *
    * @param string $tenantId The tenant ID
     * @param string $gatewayName The payment gateway name
     * @return bool Success status
     */
    public function refreshOAuthToken(string $tenantId, string $gatewayName): bool
    {
        $config = $this->configManager->getStoreGatewayConfigByName($tenantId, $gatewayName);

        if (!$config || !$config->oauthRefreshToken) {
            return false;
        }

        $gatewayName = strtolower($gatewayName);

        return match ($gatewayName) {
            'razorpay' => $this->refreshRazorpayToken($tenantId, $config),
            'paypal' => $this->refreshPayPalToken($tenantId, $config),
            'stripe' => true, // Stripe doesn't support refresh token in standard flow
            default => false,
        };
    }

    /**
     * Refresh Razorpay token.
     *
    * @param string $tenantId
     * @param StoreGatewayConfigDTO $config
     * @return bool
     */
    private function refreshRazorpayToken(string $tenantId, StoreGatewayConfigDTO $config): bool
    {
        try {
            $response = Http::post('https://auth.razorpay.com/oauth/token', [
                'client_id' => config('payment.gateways.razorpay.oauth_client_id'),
                'client_secret' => config('payment.gateways.razorpay.oauth_secret'),
                'refresh_token' => $config->oauthRefreshToken,
                'grant_type' => 'refresh_token',
            ]);

            if (!$response->successful()) {
                return false;
            }

            $data = $response->json();

            $updatedConfig = StoreGatewayConfigDTO::create([
                'tenant_id' => $tenantId,
                'gateway' => 'razorpay',
                'is_active' => true,
                'oauth_token' => $data['access_token'] ?? null,
                'oauth_refresh_token' => $data['refresh_token'] ?? $config->oauthRefreshToken,
                'gateway_account_id' => $config->gatewayAccountId,
                'metadata' => $config->metadata,
            ]);

            $this->configManager->saveStoreGatewayConfig($updatedConfig);
            return true;
        } catch (\Exception $e) {
            Log::error('Razorpay token refresh failed', [
                'error' => $e->getMessage(),
                'tenant_id' => $tenantId,
            ]);
            return false;
        }
    }

    /**
     * Refresh PayPal token.
     *
    * @param string $tenantId
     * @param StoreGatewayConfigDTO $config
     * @return bool
     */
    private function refreshPayPalToken(string $tenantId, StoreGatewayConfigDTO $config): bool
    {
        try {
            $response = Http::withBasicAuth(
                config('payment.gateways.paypal.oauth_client_id'),
                config('payment.gateways.paypal.oauth_secret')
            )->post('https://api.paypal.com/v1/oauth2/token', [
                'grant_type' => 'refresh_token',
                'refresh_token' => $config->oauthRefreshToken,
            ]);

            if (!$response->successful()) {
                return false;
            }

            $data = $response->json();

            $updatedConfig = StoreGatewayConfigDTO::create([
                'tenant_id' => $tenantId,
                'gateway' => 'paypal',
                'is_active' => true,
                'oauth_token' => $data['access_token'] ?? null,
                'oauth_refresh_token' => $data['refresh_token'] ?? $config->oauthRefreshToken,
                'gateway_account_id' => $config->gatewayAccountId,
                'metadata' => $config->metadata,
            ]);

            $this->configManager->saveStoreGatewayConfig($updatedConfig);
            return true;
        } catch (\Exception $e) {
            Log::error('PayPal token refresh failed', [
                'error' => $e->getMessage(),
                'tenant_id' => $tenantId,
            ]);
            return false;
        }
    }

    /**
     * Disconnect a store from a payment gateway.
     *
    * @param string $tenantId The tenant ID
     * @param string $gatewayName The payment gateway name
     * @return bool Success status
     */
    public function disconnectGateway(string $tenantId, string $gatewayName): bool
    {
        return $this->configManager->deactivateGatewayConfig($tenantId, $gatewayName);
    }

    /**
     * Get list of OAuth-connected gateways for a store.
     *
    * @param string $tenantId The tenant ID
     * @return array Array of connected gateway names
     */
    public function getConnectedGateways(string $tenantId): array
    {
        $configs = $this->configManager->getStoreAllGatewayConfigs($tenantId);
        return array_column($configs, 'gateway');
    }

    /**
     * Check if a store is connected to a specific gateway.
     *
    * @param string $tenantId The tenant ID
     * @param string $gatewayName The payment gateway name
     * @return bool Whether the store is connected
     */
    public function isStoreConnected(string $tenantId, string $gatewayName): bool
    {
        return $this->configManager->hasValidGatewayConfig($tenantId, $gatewayName);
    }
}
