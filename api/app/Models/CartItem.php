<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    use UUIDPrimary;

    protected $fillable = [
        'id',
        'cart_id',
        'product_id',
        'product_name',
        'product_sku',
        'quantity',
        'unit_price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
    ];
}
