<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $categories = Category::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $store->id)
            ->orderBy('depth')
            ->orderBy('name')
            ->get();

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

        $products = Product::query()
            ->withoutGlobalScopes()
            ->with([
                'images:id,product_id,image_url,media_type,storage_path,alt_text,sort_order,file_size,mime_type,disk',
                'variants:id,parent_product_id,name,sku,price,stock,description,meta_title,meta_description,meta_keywords,specifications',
                'tags:id,product_id,tag_name',
            ])
            ->where('tenant_id', $store->id)
            ->when($request->filled('q'), function ($query) use ($request): void {
                $q = '%'.$request->string('q').'%';
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
}
