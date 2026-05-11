<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class InventoryController extends Controller
{
    public function stocks(): JsonResponse
    {
        return response()->json(['status' => 'not_implemented'], 501);
    }

    public function stockByItem(string $itemId): JsonResponse
    {
        return response()->json(['status' => 'not_implemented', 'item_id' => $itemId], 501);
    }

    public function operations(): JsonResponse
    {
        return response()->json(['status' => 'not_implemented'], 501);
    }

    public function createOperation(): JsonResponse
    {
        return response()->json(['status' => 'not_implemented'], 501);
    }

    public function compositions(): JsonResponse
    {
        return response()->json(['status' => 'not_implemented'], 501);
    }

    public function createComposition(): JsonResponse
    {
        return response()->json(['status' => 'not_implemented'], 501);
    }
}
