<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Merchant;

use App\Enums\TenantStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\MerchantUser;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreController extends Controller
{
    /**
     * GET /api/v1/merchant/stores
     * Returns all stores accessible by the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $tenantIds = DB::table('merchant_users')
            ->where('user_id', $user->id)
            ->pluck('tenant_id')
            ->filter()
            ->values();

        if ($user->tenant_id && ! $tenantIds->contains($user->tenant_id)) {
            $tenantIds->push($user->tenant_id);
        }

        $stores = Tenant::query()
            ->whereIn('id', $tenantIds)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['stores' => $stores]);
    }

    /**
     * GET /api/v1/merchant/store
     * Returns the authenticated merchant's store or null.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->tenant_id) {
            return response()->json(['store' => null]);
        }

        $tenant = Tenant::find($user->tenant_id);

        return response()->json(['store' => $tenant]);
    }

    /**
     * POST /api/v1/merchant/store
     * Create a new store for the authenticated merchant.
     */
    public function create(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required', 'string', 'max:100',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('tenants', 'slug'),
            ],
            'plan' => ['nullable', 'string', 'in:starter,growth,enterprise'],
        ]);

        $tenant = Tenant::create([
            'id'     => Str::uuid()->toString(),
            'name'   => $validated['name'],
            'slug'   => $validated['slug'],
            'status' => TenantStatus::Active->value,
            'plan'   => $validated['plan'] ?? null,
        ]);

        MerchantUser::create([
            'id' => Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role_id' => null,
        ]);

        if (! $user->tenant_id) {
            $user->update(['tenant_id' => $tenant->id]);
        }

        return response()->json([
            'store' => $tenant,
            'user'  => new UserResource($user->fresh()),
        ], 201);
    }

    /**
     * PUT /api/v1/merchant/store
     * Update the merchant's store details.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->tenant_id) {
            return response()->json(['message' => 'No store found. Create one first.'], 404);
        }

        $tenant = Tenant::findOrFail($user->tenant_id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes', 'required', 'string', 'max:100',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('tenants', 'slug')->ignore($tenant->id),
            ],
            'plan' => ['sometimes', 'nullable', 'string', 'in:starter,growth,enterprise'],
        ]);

        $tenant->update($validated);

        return response()->json(['store' => $tenant->fresh()]);
    }
}
