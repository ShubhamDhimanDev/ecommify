<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use UUIDPrimary;

    protected $fillable = [
        'id',
        'order_id',
        'product_id',
        'product_name',
        'product_sku',
        'quantity',
        'unit_price',
        'line_total',
        'product_snapshot',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'product_snapshot' => 'array',
    ];
}
