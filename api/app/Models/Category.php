<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\HasMerchantScope;
use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use UUIDPrimary;
    use HasMerchantScope;
    use SoftDeletes;

    protected $fillable = [
        'id',
        'tenant_id',
        'parent_id',
        'name',
        'slug',
        'path',
        'depth',
    ];

    protected $casts = [
        'depth' => 'integer',
    ];
}
