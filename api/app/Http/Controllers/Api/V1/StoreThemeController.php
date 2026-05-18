<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Theme;
use App\Services\ThemeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RuntimeException;

class StoreThemeController extends Controller
{
    public function show(ThemeService $themeService): JsonResponse
    {
        try {
            return response()->json([
                'data' => $themeService->getActiveThemePayload($this->currentTenant()),
            ]);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 404);
        }
    }

    public function activate(string $tenant_slug, string $theme_id, ThemeService $themeService): JsonResponse
    {
        try {
            $theme = Theme::query()->findOrFail($theme_id);
            $themeService->activateTheme($this->currentTenant(), $theme);

            return response()->json([
                'message' => 'Theme activated successfully.',
                'data' => $themeService->getActiveThemePayload($this->currentTenant()),
            ]);
        } catch (InvalidArgumentException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 404);
        }
    }

    public function updateConfig(Request $request, ThemeService $themeService): JsonResponse
    {
        $validated = $request->validate([
            'custom_config' => ['required', 'array'],
        ]);

        try {
            $themeService->updateStoreOverrides($this->currentTenant(), $validated['custom_config']);

            return response()->json([
                'message' => 'Theme overrides updated successfully.',
                'data' => $themeService->getActiveThemePayload($this->currentTenant()),
            ]);
        } catch (InvalidArgumentException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 404);
        }
    }

    private function currentTenant(): Tenant
    {
        abort_if(! app()->bound(Tenant::class), 404, 'Tenant context is not available.');

        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        return $tenant;
    }
}
