<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\HasMerchantScope;
use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use UUIDPrimary;
    use HasMerchantScope;
    use SoftDeletes;

    protected $fillable = [
        'id',
        'tenant_id',
        'category_id',
        'parent_product_id',
        'is_variant',
        'name',
        'sku',
        'price',
        'discount_type',
        'discount_value',
        'stock',
        'description',
        'hs_code',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'specifications',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'stock' => 'integer',
        'is_variant' => 'boolean',
        'meta_keywords' => 'array',
        'specifications' => 'array',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(self::class, 'parent_product_id');
    }

    public function parentProduct(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_product_id');
    }

    public function tags(): HasMany
    {
        return $this->hasMany(ProductTag::class);
    }

    public function getDiscountedPriceAttribute(): string
    {
        $price = (float) $this->price;

        if (! $this->discount_type || ! $this->discount_value) {
            return number_format($price, 2, '.', '');
        }

        $discountValue = (float) $this->discount_value;
        $discountedPrice = match ($this->discount_type) {
            'percentage' => $price - ($price * $discountValue / 100),
            'fixed' => $price - $discountValue,
            default => $price,
        };

        return number_format(max(0, $discountedPrice), 2, '.', '');
    }
}
