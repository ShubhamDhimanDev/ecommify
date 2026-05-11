<?php

declare(strict_types=1);

namespace App\Traits;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;

trait HasMerchantScope
{
    protected static function bootHasMerchantScope(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder): void {
            if (app()->bound(Tenant::class)) {
                $tenant = app(Tenant::class);
                $builder->where($builder->getModel()->getTable() . '.tenant_id', $tenant->id);
            }
        });
    }
}
