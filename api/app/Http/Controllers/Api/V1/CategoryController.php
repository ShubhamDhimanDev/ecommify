<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::query()
            ->when($request->filled('q'), function ($query) use ($request): void {
                $query->where('name', 'like', '%'.$request->string('q').'%');
            })
            ->when($request->filled('parent_id'), function ($query) use ($request): void {
                $query->where('parent_id', $request->string('parent_id'));
            })
            ->orderBy('depth')
            ->orderBy('name')
            ->get();

        return response()->json(['categories' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/',
                Rule::unique('categories', 'slug')->where(fn ($q) => $q->where('tenant_id', $tenant->id)),
            ],
            'parent_id' => ['nullable', 'uuid'],
        ]);

        $id = Str::uuid()->toString();

        $parent = null;
        if (! empty($validated['parent_id'])) {
            $parent = Category::query()->findOrFail($validated['parent_id']);
        }

        $depth = $parent ? ($parent->depth + 1) : 0;
        $path = $parent ? ($parent->path.'/'.$id) : $id;

        $category = Category::query()->create([
            'id' => $id,
            'tenant_id' => $tenant->id,
            'parent_id' => $parent?->id,
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'path' => $path,
            'depth' => $depth,
        ]);

        return response()->json(['category' => $category], 201);
    }

    public function show(string $id): JsonResponse
    {
        $category = Category::query()->findOrFail($id);
        return response()->json(['category' => $category]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $category = Category::query()->findOrFail($id);
        $oldPath = (string) $category->path;

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes', 'required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/',
                Rule::unique('categories', 'slug')
                    ->ignore($category->id)
                    ->where(fn ($q) => $q->where('tenant_id', $tenant->id)),
            ],
            'parent_id' => ['sometimes', 'nullable', 'uuid'],
        ]);

        if (array_key_exists('parent_id', $validated)) {
            $parentId = $validated['parent_id'];

            if ($parentId === $category->id) {
                return response()->json(['message' => 'Category cannot be its own parent.'], 422);
            }

            $parent = null;
            if ($parentId) {
                $parent = Category::query()->findOrFail($parentId);

                if (str_starts_with((string) $parent->path, $oldPath.'/')) {
                    return response()->json(['message' => 'Cannot move category under its descendant.'], 422);
                }
            }

            $newDepth = $parent ? ($parent->depth + 1) : 0;
            $newPath = $parent ? ($parent->path.'/'.$category->id) : $category->id;

            $validated['depth'] = $newDepth;
            $validated['path'] = $newPath;

            if ($newPath !== $oldPath) {
                /** @var \Illuminate\Database\Eloquent\Collection<int, Category> $descendants */
                $descendants = Category::query()
                    ->where('path', 'like', $oldPath.'/%')
                    ->get();

                foreach ($descendants as $descendant) {
                    /** @var Category $descendant */
                    $descendant->path = preg_replace('/^'.preg_quote($oldPath, '/').'\//', $newPath.'/', (string) $descendant->path) ?: $descendant->path;
                    $descendant->depth = max(0, substr_count((string) $descendant->path, '/') - substr_count($newPath, '/') + $newDepth + 1);
                    $descendant->save();
                }
            }
        }

        $category->update($validated);

        return response()->json(['category' => $category->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        $category = Category::query()->findOrFail($id);

        $hasChildren = Category::query()->where('parent_id', $category->id)->exists();
        if ($hasChildren) {
            return response()->json(['message' => 'Category has child categories. Delete children first.'], 409);
        }

        $category->delete();

        return response()->json(status: 204);
    }
}
