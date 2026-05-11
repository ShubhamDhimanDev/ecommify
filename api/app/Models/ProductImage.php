<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    use UUIDPrimary;

    protected $fillable = [
        'id',
        'product_id',
        'image_url',
        'media_type',
        'storage_path',
        'alt_text',
        'sort_order',
        'file_size',
        'mime_type',
        'disk',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'file_size' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
