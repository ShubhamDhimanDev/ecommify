<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusEvent;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('customer_id'), fn ($q) => $q->where('customer_id', $request->string('customer_id')))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($orders);
    }

    public function show(string $id): JsonResponse
    {
        $order = Order::query()->findOrFail($id);
        $items = OrderItem::query()->where('order_id', $order->id)->orderBy('created_at')->get();
        $events = OrderStatusEvent::query()->where('order_id', $order->id)->orderBy('created_at')->get();

        return response()->json([
            'order' => $order,
            'items' => $items,
            'events' => $events,
        ]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'])],
            'note' => ['nullable', 'string'],
        ]);

        $order = Order::query()->findOrFail($id);
        $fromStatus = $order->status;
        $toStatus = $validated['status'];

        if ($fromStatus === $toStatus) {
            return response()->json(['order' => $order]);
        }

        $order->status = $toStatus;
        $order->save();

        OrderStatusEvent::query()->create([
            'id' => Str::uuid()->toString(),
            'order_id' => $order->id,
            'tenant_id' => $tenant->id,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'note' => $validated['note'] ?? null,
        ]);

        return response()->json(['order' => $order->fresh()]);
    }
}
