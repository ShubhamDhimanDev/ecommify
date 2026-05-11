<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function send(): JsonResponse
    {
        return response()->json(['status' => 'not_implemented'], 501);
    }

    public function logs(): JsonResponse
    {
        return response()->json(['status' => 'not_implemented'], 501);
    }

    public function registerWebhook(): JsonResponse
    {
        return response()->json(['status' => 'not_implemented'], 501);
    }

    public function webhooks(): JsonResponse
    {
        return response()->json(['status' => 'not_implemented'], 501);
    }
}
