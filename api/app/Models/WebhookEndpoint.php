<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\HasMerchantScope;
use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class WebhookEndpoint extends Model
{
    use UUIDPrimary;
    use HasMerchantScope;

    protected $fillable = [
        'id',
        'tenant_id',
        'url',
        'secret',
        'events',
        'is_active',
        'last_triggered_at',
    ];

    protected $casts = [
        'events' => 'array',
        'is_active' => 'boolean',
        'last_triggered_at' => 'datetime',
    ];
}
