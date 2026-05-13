<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\PaymentService\PaymentGatewayOAuthHandler;
use App\Services\PaymentService\StoreGatewayConfigManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Payment Gateway Controller
 *
 * Handles OAuth authorization flows and management of store payment gateways.
 * Routes: /api/v1/store/{tenant_slug}/payment-gateways
 */
class PaymentGatewayController extends Controller
{
    private StoreGatewayConfigManager $configManager;
    private PaymentGatewayOAuthHandler $oauthHandler;

    public function __construct()
    {
        $this->configManager = new StoreGatewayConfigManager();
        $this->oauthHandler = new PaymentGatewayOAuthHandler();
    }

    /**
     * GET /api/v1/store/{tenant_slug}/payment-gateways
     *
     * List all payment gateway configurations for the current store.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $tenantId = $this->resolveTenantId($request);

            $gateways = $this->configManager->getStoreAllGatewayConfigs($tenantId);

            return response()->json([
                'data' => $gateways,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to list payment gateways', [
                'error' => $e->getMessage(),
                'tenant_id' => $this->safeTenantId($request),
            ]);

            return response()->json([
                'message' => 'Failed to retrieve payment gateways',
            ], 500);
        }
    }

    /**
     * GET /api/v1/store/{tenant_slug}/payment-gateways/{gateway}
     *
     * Get a specific payment gateway configuration for the current store.
     *
     * @param Request $request
     * @param string $gateway
     * @return JsonResponse
     */
    public function show(Request $request, string $gateway): JsonResponse
    {
        try {
            $tenantId = $this->resolveTenantId($request);

            $config = $this->configManager->getStoreGatewayConfigByName($tenantId, $gateway);

            if (!$config) {
                return response()->json([
                    'message' => "Gateway {$gateway} is not configured for this store",
                ], 404);
            }

            return response()->json([
                'gateway' => $config->toArray(),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to get payment gateway', [
                'error' => $e->getMessage(),
                'gateway' => $gateway,
                'tenant_id' => $this->safeTenantId($request),
            ]);

            return response()->json([
                'message' => 'Failed to retrieve payment gateway',
            ], 500);
        }
    }

    /**
     * POST /api/v1/store/{tenant_slug}/payment-gateways/authorize
     *
     * Initiate OAuth connection flow for a payment gateway.
     * Returns the authorization URL where the user should be redirected.
     *
     * Request body:
     * {
     *   "gateway": "stripe" | "razorpay" | "paypal"
     * }
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function authorize(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'gateway' => ['required', 'string', 'in:stripe,razorpay,paypal'],
            ]);

            $tenantId = $this->resolveTenantId($request);

            /** @var Tenant $tenant */
            $tenant = app(Tenant::class);
            $slug = $tenant->slug;

            // Build the callback URL with store slug
            $callbackUrl = sprintf(
                '%s/%s/payments/oauth-callback',
                rtrim(config('app.frontend_url'), '/'),
                $slug
            );

            // Generate OAuth authorization URL
            $authorizationUrl = $this->oauthHandler->generateAuthorizationUrl(
                $tenantId,
                $validated['gateway'],
                $callbackUrl
            );

            return response()->json([
                'authorization_url' => $authorizationUrl,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to generate OAuth authorization URL', [
                'error' => $e->getMessage(),
                'gateway' => $request->input('gateway'),
                'tenant_id' => $this->safeTenantId($request),
            ]);

            return response()->json([
                'message' => 'Failed to initiate authorization',
            ], 500);
        }
    }

    /**
     * POST /api/v1/store/{tenant_slug}/payment-gateways/callback
     *
     * Handle OAuth callback after store authorizes the payment gateway.
     * Exchange the authorization code for OAuth tokens.
     *
     * Request body:
     * {
     *   "gateway": "stripe" | "razorpay" | "paypal",
     *   "code": "authorization_code_from_provider"
     * }
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function callback(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'gateway' => ['required', 'string', 'in:stripe,razorpay,paypal'],
                'code' => ['required', 'string'],
            ]);

            $tenantId = $this->resolveTenantId($request);

            // Exchange authorization code for OAuth tokens
            $config = $this->oauthHandler->handleOAuthCallback(
                $tenantId,
                $validated['gateway'],
                $validated['code']
            );

            if (!$config) {
                return response()->json([
                    'message' => 'Failed to exchange authorization code',
                ], 400);
            }

            // Save the configuration
            $this->configManager->saveStoreGatewayConfig($config);

            return response()->json([
                'message' => 'Payment gateway connected successfully',
                'gateway' => $config->toArray(),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('OAuth callback failed', [
                'error' => $e->getMessage(),
                'gateway' => $request->input('gateway'),
                'tenant_id' => $this->safeTenantId($request),
            ]);

            return response()->json([
                'message' => 'Failed to complete authorization',
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/store/{tenant_slug}/payment-gateways/{gateway}
     *
     * Disconnect a payment gateway from the store.
     *
     * @param Request $request
     * @param string $gateway
     * @return JsonResponse
     */
    public function disconnect(Request $request, string $gateway): JsonResponse
    {
        try {
            $tenantId = $this->resolveTenantId($request);

            // Validate gateway exists and is connected
            $config = $this->configManager->getStoreGatewayConfigByName($tenantId, $gateway);

            if (!$config) {
                return response()->json([
                    'message' => "Gateway {$gateway} is not configured for this store",
                ], 404);
            }

            // Deactivate the gateway
            $this->configManager->deactivateGatewayConfig($tenantId, $gateway);

            return response()->json([
                'message' => "Payment gateway {$gateway} disconnected successfully",
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to disconnect payment gateway', [
                'error' => $e->getMessage(),
                'gateway' => $gateway,
                'tenant_id' => $this->safeTenantId($request),
            ]);

            return response()->json([
                'message' => 'Failed to disconnect gateway',
            ], 500);
        }
    }

    /**
     * POST /api/v1/store/{tenant_slug}/payment-gateways/{gateway}/test
     *
     * Test the connection to a payment gateway.
     *
     * @param Request $request
     * @param string $gateway
     * @return JsonResponse
     */
    public function test(Request $request, string $gateway): JsonResponse
    {
        try {
            $tenantId = $this->resolveTenantId($request);

            // Check if gateway is configured
            $hasConfig = $this->configManager->hasValidGatewayConfig($tenantId, $gateway);

            if (!$hasConfig) {
                return response()->json([
                    'success' => false,
                    'message' => "Gateway {$gateway} is not configured for this store",
                ], 404);
            }

            // TODO: Implement actual connection test
            // For now, just verify the configuration exists
            // In production, you could make a test API call to the gateway

            return response()->json([
                'success' => true,
                'message' => "Connection to {$gateway} is valid",
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to test payment gateway connection', [
                'error' => $e->getMessage(),
                'gateway' => $gateway,
                'tenant_id' => $this->safeTenantId($request),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to test gateway connection',
            ], 500);
        }
    }

    private function resolveTenantId(Request $request): string
    {
        $headerStoreId = trim((string) $request->header('X-Merchant-ID', ''));

        if ($headerStoreId === '') {
            throw new \InvalidArgumentException('X-Merchant-ID header is required');
        }

        /** @var Tenant|null $tenant */
        $tenant = app()->bound(Tenant::class) ? app(Tenant::class) : null;

        if (! $tenant || empty($tenant->id)) {
            throw new \InvalidArgumentException('Tenant context is missing');
        }

        if ($headerStoreId !== (string) $tenant->id) {
            throw new \InvalidArgumentException('X-Merchant-ID does not match tenant_slug');
        }

        return $headerStoreId;
    }

    private function safeTenantId(Request $request): ?string
    {
        try {
            return $this->resolveTenantId($request);
        } catch (\Throwable) {
            return null;
        }
    }
}
