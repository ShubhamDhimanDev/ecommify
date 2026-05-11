<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\HasMerchantScope;
use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class InventoryComposition extends Model
{
    use UUIDPrimary;
    use HasMerchantScope;

    protected $fillable = [
        'id',
        'tenant_id',
        'item_id',
        'component_item_id',
        'quantity_per_unit',
        'purpose',
    ];

    protected $casts = [
        'quantity_per_unit' => 'decimal:4',
    ];
}
