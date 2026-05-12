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
        'name',
        'sku',
        'price',
        'stock',
        'description',
        'hs_code',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer',
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
        return $this->hasMany(ProductVariant::class);
    }

    public function tags(): HasMany
    {
        return $this->hasMany(ProductTag::class);
    }
}
