<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusEvent;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CartController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $validated = $request->validate([
            'customer_id' => ['nullable', 'uuid'],
            'session_id' => ['nullable', 'string', 'max:255'],
            'currency' => ['nullable', 'string', 'size:3'],
            'metadata' => ['nullable', 'array'],
        ]);

        $cart = Cart::query()->create([
            'id' => Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'customer_id' => $validated['customer_id'] ?? null,
            'session_id' => $validated['session_id'] ?? null,
            'status' => 'active',
            'currency' => strtoupper($validated['currency'] ?? 'USD'),
            'metadata' => $validated['metadata'] ?? null,
        ]);

        return response()->json(['cart' => $cart], 201);
    }

    public function show(string $id): JsonResponse
    {
        $cart = Cart::query()->findOrFail($id);

        $items = CartItem::query()
            ->where('cart_id', $cart->id)
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'cart' => $cart,
            'items' => $items,
        ]);
    }

    public function addItem(Request $request, string $id): JsonResponse
    {
        $cart = Cart::query()->findOrFail($id);

        if ($cart->status !== 'active') {
            return response()->json(['message' => 'Only active carts can be modified.'], 409);
        }

        $validated = $request->validate([
            'product_id' => ['required', 'uuid'],
            'quantity' => ['required', 'integer', 'min:1'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $product = Product::query()->findOrFail($validated['product_id']);

        $item = CartItem::query()->where('cart_id', $cart->id)->where('product_id', $product->id)->first();

        if ($item) {
            $item->quantity += $validated['quantity'];
            if (isset($validated['unit_price'])) {
                $item->unit_price = $validated['unit_price'];
            }
            $item->save();
        } else {
            $item = CartItem::query()->create([
                'id' => Str::uuid()->toString(),
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'product_sku' => $product->sku,
                'quantity' => $validated['quantity'],
                'unit_price' => $validated['unit_price'] ?? (float) $product->price,
            ]);
        }

        return response()->json(['item' => $item], 201);
    }

    public function removeItem(string $id, string $itemId): JsonResponse
    {
        $cart = Cart::query()->findOrFail($id);

        if ($cart->status !== 'active') {
            return response()->json(['message' => 'Only active carts can be modified.'], 409);
        }

        CartItem::query()->where('cart_id', $cart->id)->where('id', $itemId)->firstOrFail()->delete();

        return response()->json(status: 204);
    }

    public function checkout(Request $request, string $id): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $cart = Cart::query()->findOrFail($id);

        if ($cart->status !== 'active') {
            return response()->json(['message' => 'Cart is not active.'], 409);
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);

        $items = CartItem::query()->where('cart_id', $cart->id)->get();

        if ($items->isEmpty()) {
            return response()->json(['message' => 'Cart has no items.'], 422);
        }

        $taxAmount = (float) ($validated['tax_amount'] ?? 0);
        $subtotal = (float) $items->sum(fn (CartItem $item) => (float) $item->unit_price * $item->quantity);
        $total = $subtotal + $taxAmount;

        $order = DB::transaction(function () use ($tenant, $cart, $items, $validated, $subtotal, $taxAmount, $total): Order {
            $order = Order::query()->create([
                'id' => Str::uuid()->toString(),
                'tenant_id' => $tenant->id,
                'cart_id' => $cart->id,
                'customer_id' => $cart->customer_id,
                'status' => 'pending',
                'currency' => $cart->currency,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $total,
                'notes' => $validated['notes'] ?? null,
                'metadata' => $validated['metadata'] ?? $cart->metadata,
            ]);

            foreach ($items as $item) {
                $lineTotal = (float) $item->unit_price * $item->quantity;

                OrderItem::query()->create([
                    'id' => Str::uuid()->toString(),
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'product_sku' => $item->product_sku,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'line_total' => $lineTotal,
                    'product_snapshot' => [
                        'name' => $item->product_name,
                        'sku' => $item->product_sku,
                    ],
                ]);
            }

            OrderStatusEvent::query()->create([
                'id' => Str::uuid()->toString(),
                'order_id' => $order->id,
                'tenant_id' => $tenant->id,
                'from_status' => null,
                'to_status' => 'pending',
                'note' => 'Order created from checkout.',
            ]);

            $cart->status = 'checked_out';
            $cart->save();

            return $order;
        });

        return response()->json(['order' => $order], 201);
    }
}
