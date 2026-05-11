<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customers = Customer::query()
            ->when($request->filled('q'), function ($q) use ($request): void {
                $search = '%'.$request->string('q').'%';
                $q->where(function ($inner) use ($search): void {
                    $inner->where('first_name', 'like', $search)
                        ->orWhere('last_name', 'like', $search)
                        ->orWhere('email', 'like', $search)
                        ->orWhere('phone', 'like', $search);
                });
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($customers);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', Rule::unique('customers', 'email')->where(fn ($q) => $q->where('tenant_id', $tenant->id))],
            'phone' => ['nullable', 'string', 'max:30', Rule::unique('customers', 'phone')->where(fn ($q) => $q->where('tenant_id', $tenant->id))],
            'notes' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $customer = Customer::query()->create([
            'id' => Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'] ?? null,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'metadata' => $validated['metadata'] ?? null,
            'password_hash' => ! empty($validated['password']) ? Hash::make($validated['password']) : null,
        ]);

        return response()->json(['customer' => $customer], 201);
    }

    public function show(string $id): JsonResponse
    {
        $customer = Customer::query()->findOrFail($id);
        return response()->json(['customer' => $customer]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $customer = Customer::query()->findOrFail($id);

        $validated = $request->validate([
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'last_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'email' => [
                'sometimes', 'nullable', 'email',
                Rule::unique('customers', 'email')
                    ->ignore($customer->id)
                    ->where(fn ($q) => $q->where('tenant_id', $tenant->id)),
            ],
            'phone' => [
                'sometimes', 'nullable', 'string', 'max:30',
                Rule::unique('customers', 'phone')
                    ->ignore($customer->id)
                    ->where(fn ($q) => $q->where('tenant_id', $tenant->id)),
            ],
            'notes' => ['sometimes', 'nullable', 'string'],
            'metadata' => ['sometimes', 'nullable', 'array'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
        ]);

        if (array_key_exists('password', $validated)) {
            $validated['password_hash'] = ! empty($validated['password']) ? Hash::make((string) $validated['password']) : null;
            unset($validated['password']);
        }

        $customer->update($validated);

        return response()->json(['customer' => $customer->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        Customer::query()->findOrFail($id)->delete();
        return response()->json(status: 204);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_slug' => ['required', 'string'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $tenant = Tenant::query()->where('slug', $validated['store_slug'])->where('status', 'active')->first();
        if (! $tenant) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $exists = Customer::query()->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('email', $validated['email'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Customer already registered for this store.'], 409);
        }

        $customer = Customer::query()->withoutGlobalScopes()->create([
            'id' => Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'] ?? null,
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password_hash' => Hash::make($validated['password']),
        ]);

        return response()->json(['customer' => $customer], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_slug' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $tenant = Tenant::query()->where('slug', $validated['store_slug'])->where('status', 'active')->first();
        if (! $tenant) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $customer = Customer::query()->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('email', $validated['email'])
            ->first();

        if (! $customer || ! $customer->password_hash || ! Hash::check($validated['password'], $customer->password_hash)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        return response()->json([
            'customer' => $customer,
            'store' => [
                'id' => $tenant->id,
                'slug' => $tenant->slug,
                'name' => $tenant->name,
            ],
        ]);
    }
}
