<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\HasMerchantScope;
use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    use UUIDPrimary;
    use HasMerchantScope;

    protected $fillable = [
        'id',
        'tenant_id',
        'customer_id',
        'session_id',
        'status',
        'currency',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];
}
