<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\HasMerchantScope;
use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class InventoryOperation extends Model
{
    use UUIDPrimary;
    use HasMerchantScope;

    public $timestamps = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'operation_type',
        'reference',
        'reason',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}
