<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    public function store(): JsonResponse
    {
        return response()->json(['status' => 'not_implemented'], 501);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['status' => 'not_implemented', 'payment_id' => $id], 501);
    }

    public function refund(string $id): JsonResponse
    {
        return response()->json(['status' => 'not_implemented', 'payment_id' => $id], 501);
    }

    public function webhook(): JsonResponse
    {
        return response()->json(['status' => 'not_implemented'], 501);
    }
}
