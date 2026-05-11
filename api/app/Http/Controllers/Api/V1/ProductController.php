<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductTag;
use App\Models\ProductVariant;
use App\Models\Tenant;
use App\Services\MediaUploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function __construct(private readonly MediaUploader $mediaUploader)
    {
    }

    private const PRODUCT_RELATIONS = [
        'category:id,name,slug',
        'tags:id,product_id,tag_name',
        'images:id,product_id,image_url,media_type,storage_path,alt_text,sort_order,file_size,mime_type,disk',
        'variants:id,product_id,name,sku,price,stock',
    ];

    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with(self::PRODUCT_RELATIONS)
            ->when($request->filled('q'), function ($query) use ($request): void {
                $q = '%'.$request->string('q').'%';
                $query->where(function ($inner) use ($q): void {
                    $inner->where('name', 'like', $q)
                        ->orWhere('sku', 'like', $q);
                });
            })
            ->when($request->filled('category_id'), function ($query) use ($request): void {
                $query->where('category_id', $request->string('category_id'));
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => [
                'required', 'string', 'max:255',
                Rule::unique('products', 'sku')->where(fn ($q) => $q->where('tenant_id', $tenant->id)),
            ],
            'category_id' => ['nullable', 'uuid'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'hs_code' => ['nullable', 'string', 'max:50'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:80'],
            'media' => ['nullable', 'array'],
            'media.*.id' => ['nullable', 'uuid'],
            'media.*.image_url' => ['required', 'string', 'max:2048'],
            'media.*.media_type' => ['nullable', Rule::in(['image', 'video'])],
            'media.*.storage_path' => ['nullable', 'string', 'max:2048'],
            'media.*.alt_text' => ['nullable', 'string', 'max:255'],
            'media.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'media.*.file_size' => ['nullable', 'integer', 'min:0'],
            'media.*.mime_type' => ['nullable', 'string', 'max:100'],
            'media.*.disk' => ['nullable', 'string', 'max:100'],
            'media_uploads' => ['nullable', 'array'],
            'media_uploads.*' => ['file', 'max:51200', 'mimetypes:image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska'],
            'media_upload_orders' => ['nullable', 'array'],
            'media_upload_orders.*' => ['nullable', 'integer', 'min:0'],
            'media_upload_alt_texts' => ['nullable', 'array'],
            'media_upload_alt_texts.*' => ['nullable', 'string', 'max:255'],
            'media_present' => ['nullable', 'boolean'],
            'variants' => ['nullable', 'array'],
            'variants.*.name' => ['required', 'string', 'max:255'],
            'variants.*.sku' => ['required', 'string', 'max:255', 'distinct'],
            'variants.*.price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.stock' => ['nullable', 'integer', 'min:0'],
        ]);

        if (! empty($validated['category_id'])) {
            Category::query()->findOrFail($validated['category_id']);
        }

        $product = DB::transaction(function () use ($validated, $tenant, $request): Product {
            $product = Product::query()->create([
                'id' => Str::uuid()->toString(),
                'tenant_id' => $tenant->id,
                'category_id' => $validated['category_id'] ?? null,
                'name' => $validated['name'],
                'sku' => $validated['sku'],
                'price' => $validated['price'],
                'stock' => $validated['stock'] ?? 0,
                'description' => $validated['description'] ?? null,
                'hs_code' => $validated['hs_code'] ?? null,
            ]);

            $this->syncProductDetails($product, $validated, $request, $tenant);

            return $product->fresh(self::PRODUCT_RELATIONS);
        });

        return response()->json(['product' => $product], 201);
    }

    public function show(string $id): JsonResponse
    {
        $product = Product::query()->with(self::PRODUCT_RELATIONS)->findOrFail($id);
        return response()->json(['product' => $product]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $product = Product::query()->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'sku' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('products', 'sku')
                    ->ignore($product->id)
                    ->where(fn ($q) => $q->where('tenant_id', $tenant->id)),
            ],
            'category_id' => ['sometimes', 'nullable', 'uuid'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'required', 'integer', 'min:0'],
            'description' => ['sometimes', 'nullable', 'string'],
            'hs_code' => ['sometimes', 'nullable', 'string', 'max:50'],
            'tags' => ['sometimes', 'nullable', 'array'],
            'tags.*' => ['string', 'max:80'],
            'media' => ['sometimes', 'nullable', 'array'],
            'media.*.id' => ['nullable', 'uuid'],
            'media.*.image_url' => ['required', 'string', 'max:2048'],
            'media.*.media_type' => ['nullable', Rule::in(['image', 'video'])],
            'media.*.storage_path' => ['nullable', 'string', 'max:2048'],
            'media.*.alt_text' => ['nullable', 'string', 'max:255'],
            'media.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'media.*.file_size' => ['nullable', 'integer', 'min:0'],
            'media.*.mime_type' => ['nullable', 'string', 'max:100'],
            'media.*.disk' => ['nullable', 'string', 'max:100'],
            'media_uploads' => ['sometimes', 'nullable', 'array'],
            'media_uploads.*' => ['file', 'max:51200', 'mimetypes:image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska'],
            'media_upload_orders' => ['sometimes', 'nullable', 'array'],
            'media_upload_orders.*' => ['nullable', 'integer', 'min:0'],
            'media_upload_alt_texts' => ['sometimes', 'nullable', 'array'],
            'media_upload_alt_texts.*' => ['nullable', 'string', 'max:255'],
            'media_present' => ['sometimes', 'nullable', 'boolean'],
            'variants' => ['sometimes', 'nullable', 'array'],
            'variants.*.name' => ['required', 'string', 'max:255'],
            'variants.*.sku' => ['required', 'string', 'max:255', 'distinct'],
            'variants.*.price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.stock' => ['nullable', 'integer', 'min:0'],
        ]);

        if (array_key_exists('category_id', $validated) && ! empty($validated['category_id'])) {
            Category::query()->findOrFail($validated['category_id']);
        }

        DB::transaction(function () use ($product, $validated, $request, $tenant): void {
            $product->update([
                'name' => $validated['name'] ?? $product->name,
                'sku' => $validated['sku'] ?? $product->sku,
                'category_id' => array_key_exists('category_id', $validated) ? ($validated['category_id'] ?? null) : $product->category_id,
                'price' => $validated['price'] ?? $product->price,
                'stock' => $validated['stock'] ?? $product->stock,
                'description' => array_key_exists('description', $validated) ? ($validated['description'] ?? null) : $product->description,
                'hs_code' => array_key_exists('hs_code', $validated) ? ($validated['hs_code'] ?? null) : $product->hs_code,
            ]);

            $this->syncProductDetails($product, $validated, $request, $tenant);
        });

        return response()->json(['product' => $product->fresh(self::PRODUCT_RELATIONS)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $product = Product::query()->findOrFail($id);
        $product->delete();

        return response()->json(status: 204);
    }

    private function syncProductDetails(Product $product, array $validated, Request $request, Tenant $tenant): void
    {
        if (array_key_exists('tags', $validated)) {
            $tags = collect((array) ($validated['tags'] ?? []))
                ->map(fn ($tag) => trim((string) $tag))
                ->filter(fn ($tag) => $tag !== '')
                ->unique()
                ->values();

            $product->tags()->delete();

            foreach ($tags as $tag) {
                ProductTag::query()->create([
                    'id' => Str::uuid()->toString(),
                    'product_id' => $product->id,
                    'tag_name' => $tag,
                ]);
            }
        }

        $hasIncomingMedia = array_key_exists('media', $validated)
            || $request->hasFile('media_uploads')
            || (bool) $request->boolean('media_present');
        if ($hasIncomingMedia) {
            $existingMedia = collect((array) ($validated['media'] ?? []))
                ->map(function (array $media, int $index): array {
                    $sortOrder = isset($media['sort_order']) ? (int) $media['sort_order'] : $index;

                    return [
                        'image_url' => (string) ($media['image_url'] ?? ''),
                        'media_type' => in_array(($media['media_type'] ?? null), ['image', 'video'], true)
                            ? $media['media_type']
                            : (str_starts_with((string) ($media['mime_type'] ?? ''), 'video/') ? 'video' : 'image'),
                        'storage_path' => $media['storage_path'] ?? null,
                        'alt_text' => $media['alt_text'] ?? null,
                        'sort_order' => $sortOrder,
                        'file_size' => $media['file_size'] ?? null,
                        'mime_type' => $media['mime_type'] ?? null,
                        'disk' => $media['disk'] ?? null,
                    ];
                })
                ->filter(fn (array $row): bool => $row['image_url'] !== '');

            $uploadedMedia = collect();
            $uploadOrders = (array) $request->input('media_upload_orders', []);
            $uploadAltTexts = (array) $request->input('media_upload_alt_texts', []);

            foreach ((array) $request->file('media_uploads', []) as $index => $file) {
                if (! $file instanceof UploadedFile) {
                    continue;
                }

                $stored = $this->storeProductMedia($file, $tenant);
                $stored['sort_order'] = isset($uploadOrders[$index]) ? (int) $uploadOrders[$index] : (count($existingMedia) + $index);
                $stored['alt_text'] = $uploadAltTexts[$index] ?? null;

                $uploadedMedia->push($stored);
            }

            $allMedia = $existingMedia
                ->concat($uploadedMedia)
                ->sortBy('sort_order')
                ->values()
                ->map(function (array $row, int $index): array {
                    $row['sort_order'] = $index;
                    return $row;
                });

            $oldMedia = $product->images()->get(['storage_path', 'disk']);
            $keptPaths = $allMedia
                ->pluck('storage_path')
                ->filter(fn ($path) => is_string($path) && $path !== '')
                ->values();

            foreach ($oldMedia as $old) {
                if (! $old->storage_path || $keptPaths->contains($old->storage_path)) {
                    continue;
                }

                $this->mediaUploader->deleteByPath($old->storage_path, $old->disk);
            }

            $product->images()->delete();

            foreach ($allMedia as $media) {
                ProductImage::query()->create([
                    'id' => Str::uuid()->toString(),
                    'product_id' => $product->id,
                    'image_url' => $media['image_url'],
                    'media_type' => $media['media_type'],
                    'storage_path' => $media['storage_path'],
                    'alt_text' => $media['alt_text'],
                    'sort_order' => $media['sort_order'],
                    'file_size' => $media['file_size'],
                    'mime_type' => $media['mime_type'],
                    'disk' => $media['disk'] ?? 'public',
                ]);
            }
        }

        if (array_key_exists('variants', $validated)) {
            $variants = (array) ($validated['variants'] ?? []);

            $product->variants()->delete();

            foreach ($variants as $variant) {
                ProductVariant::query()->create([
                    'id' => Str::uuid()->toString(),
                    'product_id' => $product->id,
                    'name' => $variant['name'],
                    'sku' => $variant['sku'],
                    'price' => $variant['price'] ?? null,
                    'stock' => $variant['stock'] ?? 0,
                ]);
            }
        }
    }

    private function storeProductMedia(UploadedFile $file, Tenant $tenant): array
    {
        return $this->mediaUploader->uploadProductMedia($file, $tenant);
    }
}
