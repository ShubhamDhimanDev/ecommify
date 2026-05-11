<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\HasMerchantScope;
use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use UUIDPrimary;
    use HasMerchantScope;

    protected $fillable = [
        'id',
        'tenant_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'notes',
        'metadata',
        'password_hash',
        'email_verified',
        'phone_verified',
        'email_verified_at',
        'phone_verified_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'email_verified' => 'boolean',
        'phone_verified' => 'boolean',
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
    ];
}
