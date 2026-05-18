<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class StoreTheme extends Model
{
    use HasFactory;
    use UUIDPrimary;

    public $timestamps = false;

    protected $fillable = [
        'id',
        'store_id',
        'theme_id',
        'is_active',
        'custom_config',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'is_active' => 'bool',
        'custom_config' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $storeTheme): void {
            if (! $storeTheme->id) {
                $storeTheme->id = (string) Str::uuid();
            }

            if (! $storeTheme->created_at) {
                $storeTheme->created_at = now();
            }

            if (! $storeTheme->updated_at) {
                $storeTheme->updated_at = now();
            }
        });

        static::addGlobalScope('store', function (Builder $builder): void {
            if (app()->bound(Tenant::class)) {
                $tenant = app(Tenant::class);
                $builder->where($builder->getModel()->getTable().'.store_id', $tenant->id);
            }
        });
    }

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class, 'theme_id');
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'store_id');
    }
}
