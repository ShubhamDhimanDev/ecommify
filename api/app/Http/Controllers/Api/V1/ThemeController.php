<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ThemeService;
use Illuminate\Http\JsonResponse;

class ThemeController extends Controller
{
    public function index(ThemeService $themeService): JsonResponse
    {
        return response()->json([
            'data' => $themeService->listAvailableThemes(),
        ]);
    }
}
