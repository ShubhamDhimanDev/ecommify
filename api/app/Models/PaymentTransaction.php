<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\HasMerchantScope;
use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class PaymentTransaction extends Model
{
    use UUIDPrimary;
    use HasMerchantScope;

    protected $fillable = [
        'id',
        'tenant_id',
        'order_id',
        'gateway',
        'gateway_transaction_id',
        'status',
        'amount',
        'currency',
        'refunded_amount',
        'customer_email',
        'customer_name',
        'description',
        'metadata',
        'error_code',
        'error_message',
        'paid_at',
        'refunded_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'refunded_amount' => 'decimal:2',
        'metadata' => 'array',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];
}
