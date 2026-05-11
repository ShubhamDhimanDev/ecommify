<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\HasMerchantScope;
use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class InventoryStock extends Model
{
    use UUIDPrimary;
    use HasMerchantScope;

    protected $fillable = [
        'id',
        'tenant_id',
        'item_id',
        'quantity',
        'allow_negative',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'allow_negative' => 'boolean',
    ];
}
