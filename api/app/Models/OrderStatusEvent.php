<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class OrderStatusEvent extends Model
{
    use UUIDPrimary;

    protected $fillable = [
        'id',
        'order_id',
        'tenant_id',
        'from_status',
        'to_status',
        'note',
    ];
}
