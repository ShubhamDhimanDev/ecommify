<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Theme extends Model
{
    use HasFactory;
    use UUIDPrimary;

    public $timestamps = false;

    protected $fillable = [
        'id',
        'name',
        'code',
        'version',
        'preview_image',
        'is_public',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'is_public' => 'bool',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $theme): void {
            if (! $theme->id) {
                $theme->id = (string) Str::uuid();
            }

            if (! $theme->created_at) {
                $theme->created_at = now();
            }

            if (! $theme->updated_at) {
                $theme->updated_at = now();
            }
        });
    }

    public function storeThemes(): HasMany
    {
        return $this->hasMany(StoreTheme::class, 'theme_id');
    }
}
