<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class InventoryOperationLine extends Model
{
    use UUIDPrimary;

    public $timestamps = false;

    protected $fillable = [
        'id',
        'operation_id',
        'tenant_id',
        'item_id',
        'delta',
        'before_qty',
        'after_qty',
        'created_at',
    ];

    protected $casts = [
        'delta' => 'decimal:4',
        'before_qty' => 'decimal:4',
        'after_qty' => 'decimal:4',
        'created_at' => 'datetime',
    ];
}
