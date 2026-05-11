<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\UUIDPrimary;
use Illuminate\Database\Eloquent\Model;

class MerchantUser extends Model
{
    use UUIDPrimary;

    protected $fillable = [
        'id',
        'tenant_id',
        'user_id',
        'role_id',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
