<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\Theme;
use App\Services\ThemeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

class PublicController extends Controller
{
    public function storeBySlug(string $slug): JsonResponse
    {
        $store = Tenant::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->first();

        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        return response()->json(['store' => $store]);
    }

    public function listCategories(string $slug): JsonResponse
    {
        $store = Tenant::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->first();

        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $categories = Cache::remember(
            sprintf('public:store:%s:categories:v2', $store->id),
            now()->addMinutes(10),
            static fn () => Category::query()
                ->withoutGlobalScopes()
                ->where('tenant_id', $store->id)
                ->orderBy('depth')
                ->orderBy('name')
                ->get()
                ->toArray()
        );

        return response()->json(['categories' => $categories]);
    }

    public function listProducts(Request $request, string $slug): JsonResponse
    {
        $store = Tenant::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->first();

        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $searchTerm = $request->string('search')->trim()->value();
        if ($searchTerm === '') {
            $searchTerm = $request->string('q')->trim()->value();
        }

        $categorySlug = $request->string('category_slug')->trim()->value();
        if ($categorySlug === '') {
            $categorySlug = $request->string('category')->trim()->value();
        }

        $categoryId = null;
        if ($request->filled('category_id')) {
            $categoryId = $request->string('category_id')->value();
        } elseif ($categorySlug !== '') {
            $categoryId = Category::query()
                ->withoutGlobalScopes()
                ->where('tenant_id', $store->id)
                ->where('slug', $categorySlug)
                ->value('id');
        }

        $products = Product::query()
            ->withoutGlobalScopes()
            ->with([
                'category:id,name,slug',
                'images:id,product_id,image_url,media_type,storage_path,alt_text,sort_order,file_size,mime_type,disk',
                'variants:id,parent_product_id,name,sku,price,stock,description,meta_title,meta_description,meta_keywords,specifications',
                'tags:id,product_id,tag_name',
            ])
            ->where('tenant_id', $store->id)
            ->when($categoryId, function ($query) use ($categoryId): void {
                $query->where('category_id', $categoryId);
            })
            ->when($searchTerm !== '', function ($query) use ($searchTerm): void {
                $q = '%'.$searchTerm.'%';
                $query->where(function ($inner) use ($q): void {
                    $inner->where('name', 'like', $q)
                        ->orWhere('sku', 'like', $q);
                });
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($products);
    }

    public function productDetail(string $slug, string $id): JsonResponse
    {
        $store = Tenant::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->first();

        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $product = Product::query()
            ->withoutGlobalScopes()
            ->with([
                'images:id,product_id,image_url,media_type,storage_path,alt_text,sort_order,file_size,mime_type,disk',
                'variants:id,parent_product_id,name,sku,price,stock,description,meta_title,meta_description,meta_keywords,specifications',
                'tags:id,product_id,tag_name',
            ])
            ->where('tenant_id', $store->id)
            ->find($id);

        if (! $product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        return response()->json(['product' => $product]);
    }

    public function storeTheme(Request $request, string $slug, ThemeService $themeService): JsonResponse
    {
        $store = Tenant::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->first();

        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $previewThemeCode = $request->string('preview_theme')->trim()->value();

        try {
            if ($previewThemeCode !== '') {
                $previewTheme = Theme::query()
                    ->where('code', $previewThemeCode)
                    ->where('is_public', true)
                    ->first();

                if (! $previewTheme) {
                    return response()->json([
                        'message' => 'Preview theme not found.',
                    ], 404);
                }

                $payload = $themeService->getPreviewThemePayload($store, $previewTheme);
            } else {
                $payload = $themeService->getActiveThemePayload($store);
            }
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 404);
        }

        return response()->json([
            'data' => [
                'theme_code' => $payload['theme']['code'] ?? null,
                ...$payload,
            ],
        ]);
    }
}
