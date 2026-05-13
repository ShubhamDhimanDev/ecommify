<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\HasMerchantScope;
use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class NotificationLog extends Model
{
    use UUIDPrimary;
    use HasMerchantScope;

    public $timestamps = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'channel',
        'event_type',
        'recipient',
        'subject',
        'payload',
        'status',
        'provider_response',
        'error_message',
        'created_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'provider_response' => 'array',
        'created_at' => 'datetime',
    ];
}
