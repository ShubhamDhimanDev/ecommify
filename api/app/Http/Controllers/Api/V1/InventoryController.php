<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InventoryComposition;
use App\Models\InventoryOperation;
use App\Models\InventoryOperationLine;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InventoryController extends Controller
{
    public function stocks(Request $request): JsonResponse
    {
        $stocks = InventoryStock::query()
            ->when($request->filled('item_id'), fn ($q) => $q->where('item_id', $request->string('item_id')))
            ->orderByDesc('updated_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($stocks);
    }

    public function stockByItem(string $itemId): JsonResponse
    {
        $stock = InventoryStock::query()->where('item_id', $itemId)->first();

        if (! $stock) {
            return response()->json([
                'stock' => [
                    'item_id' => $itemId,
                    'quantity' => 0,
                    'allow_negative' => false,
                ],
            ]);
        }

        return response()->json(['stock' => $stock]);
    }

    public function operations(Request $request): JsonResponse
    {
        $operations = InventoryOperation::query()
            ->when($request->filled('operation_type'), fn ($q) => $q->where('operation_type', $request->string('operation_type')))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        $operationIds = $operations->getCollection()->pluck('id')->all();
        $linesByOperation = InventoryOperationLine::query()
            ->whereIn('operation_id', $operationIds)
            ->orderBy('created_at')
            ->get()
            ->groupBy('operation_id');

        $operations->setCollection(
            $operations->getCollection()->map(function (InventoryOperation $operation) use ($linesByOperation) {
                $operation->setAttribute('lines', $linesByOperation->get($operation->id, collect())->values());
                return $operation;
            })
        );

        return response()->json($operations);
    }

    public function createOperation(Request $request): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $validated = $request->validate([
            'operation_type' => ['required', 'string', 'in:sale,production,bundle_sale,adjustment'],
            'reference' => ['nullable', 'string', 'max:255'],
            'reason' => ['nullable', 'string'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.item_id' => ['required', 'uuid'],
            'lines.*.delta' => ['required', 'numeric', 'not_in:0'],
            'lines.*.allow_negative' => ['nullable', 'boolean'],
        ]);

        $result = DB::transaction(function () use ($validated, $tenant, $request): array {
            $operation = InventoryOperation::query()->create([
                'id' => Str::uuid()->toString(),
                'tenant_id' => $tenant->id,
                'operation_type' => $validated['operation_type'],
                'reference' => $validated['reference'] ?? null,
                'reason' => $validated['reason'] ?? null,
                'created_by' => $request->user()?->id,
                'created_at' => now(),
            ]);

            $lines = collect();

            foreach ($validated['lines'] as $lineInput) {
                $stock = InventoryStock::query()
                    ->where('item_id', $lineInput['item_id'])
                    ->lockForUpdate()
                    ->first();

                if (! $stock) {
                    $stock = InventoryStock::query()->create([
                        'id' => Str::uuid()->toString(),
                        'tenant_id' => $tenant->id,
                        'item_id' => $lineInput['item_id'],
                        'quantity' => 0,
                        'allow_negative' => (bool) ($lineInput['allow_negative'] ?? false),
                    ]);
                }

                $delta = (float) $lineInput['delta'];
                $beforeQty = (float) $stock->quantity;
                $afterQty = $beforeQty + $delta;

                $lineAllowNegative = (bool) ($lineInput['allow_negative'] ?? false);
                if ($afterQty < 0 && ! $stock->allow_negative && ! $lineAllowNegative) {
                    throw ValidationException::withMessages([
                        'lines' => ["Insufficient stock for item {$lineInput['item_id']}"],
                    ]);
                }

                $stock->quantity = (int) round($afterQty);
                if ($lineAllowNegative) {
                    $stock->allow_negative = true;
                }
                $stock->save();

                Product::query()->where('id', $lineInput['item_id'])->update(['stock' => (int) round($afterQty)]);

                $line = InventoryOperationLine::query()->create([
                    'id' => Str::uuid()->toString(),
                    'operation_id' => $operation->id,
                    'tenant_id' => $tenant->id,
                    'item_id' => $lineInput['item_id'],
                    'delta' => $delta,
                    'before_qty' => $beforeQty,
                    'after_qty' => $afterQty,
                    'created_at' => now(),
                ]);

                $lines->push($line);
            }

            return [$operation, $lines->values()];
        });

        return response()->json([
            'operation' => $result[0],
            'lines' => $result[1],
        ], 201);
    }

    public function compositions(Request $request): JsonResponse
    {
        $compositions = InventoryComposition::query()
            ->when($request->filled('item_id'), fn ($q) => $q->where('item_id', $request->string('item_id')))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($compositions);
    }

    public function createComposition(Request $request): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $validated = $request->validate([
            'item_id' => ['required', 'uuid', 'different:component_item_id'],
            'component_item_id' => ['required', 'uuid'],
            'quantity_per_unit' => ['required', 'numeric', 'gt:0'],
            'purpose' => ['nullable', 'string', 'in:production,bundle,both'],
        ]);

        $composition = InventoryComposition::query()->updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'item_id' => $validated['item_id'],
                'component_item_id' => $validated['component_item_id'],
            ],
            [
                'quantity_per_unit' => $validated['quantity_per_unit'],
                'purpose' => $validated['purpose'] ?? 'production',
            ]
        );

        return response()->json(['composition' => $composition], 201);
    }
}
