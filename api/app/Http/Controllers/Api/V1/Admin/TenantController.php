<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\TenantStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TenantController extends Controller
{
    /**
     * List all tenants (paginated).
     */
    public function index(Request $request): JsonResponse
    {
        $tenants = Tenant::query()
            ->when($request->search, fn ($q, $search) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%"))
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($tenants);
    }

    /**
     * Create a new tenant (store).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'slug'             => ['required', 'string', 'max:100', 'unique:tenants,slug', 'regex:/^[a-z0-9-]+$/'],
            'plan'             => ['nullable', 'string'],
            'owner_name'       => ['required', 'string', 'max:255'],
            'owner_email'      => ['required', 'email', 'unique:users,email'],
            'owner_password'   => ['required', 'string', 'min:8'],
        ]);

        $tenant = Tenant::create([
            'id'       => Str::uuid()->toString(),
            'name'     => $validated['name'],
            'slug'     => $validated['slug'],
            'status'   => TenantStatus::Active->value,
            'plan'     => $validated['plan'] ?? null,
        ]);

        // Create the merchant owner user for this tenant
        $owner = User::create([
            'tenant_id' => $tenant->id,
            'name'      => $validated['owner_name'],
            'email'     => $validated['owner_email'],
            'password'  => bcrypt($validated['owner_password']),
        ]);
        $owner->assignRole(UserRole::MerchantOwner->value);

        return response()->json([
            'tenant' => $tenant,
            'owner'  => $owner,
        ], 201);
    }

    /**
     * Show a single tenant.
     */
    public function show(Tenant $tenant): JsonResponse
    {
        return response()->json($tenant->load('domains'));
    }

    /**
     * Update tenant details.
     */
    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['sometimes', 'string', 'max:255'],
            'slug'     => ['sometimes', 'string', 'max:100', Rule::unique('tenants')->ignore($tenant->id), 'regex:/^[a-z0-9-]+$/'],
            'status'   => ['sometimes', Rule::enum(TenantStatus::class)],
            'plan'     => ['sometimes', 'nullable', 'string'],
            'settings' => ['sometimes', 'nullable', 'array'],
        ]);

        $tenant->update($validated);

        return response()->json($tenant->fresh());
    }

    /**
     * Suspend / activate a tenant.
     */
    public function updateStatus(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(TenantStatus::class)],
        ]);

        $tenant->update(['status' => $validated['status']]);

        return response()->json(['message' => "Tenant status updated to [{$validated['status']}]."]);
    }

    /**
     * Delete a tenant (soft approach: mark as cancelled first).
     */
    public function destroy(Tenant $tenant): JsonResponse
    {
        $tenant->update(['status' => TenantStatus::Cancelled->value]);
        $tenant->delete();

        return response()->json(['message' => 'Tenant deleted.']);
    }
}
