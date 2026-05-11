<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\HasMerchantScope;
use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class OAuthProvider extends Model
{
    use UUIDPrimary;
    use HasMerchantScope;

    protected $fillable = [
        'id',
        'tenant_id',
        'provider',
        'app_id',
        'app_secret',
        'redirect_url',
    ];

    protected $hidden = [
        'app_secret',
    ];
}
