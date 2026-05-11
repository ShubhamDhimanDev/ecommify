<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'name'                => $this->name,
            'email'               => $this->email,
            'avatar'              => $this->avatar,
            'phone'               => $this->phone,
            'status'              => $this->status,
            'tenant_id'           => $this->tenant_id,
            'email_verified_at'   => $this->email_verified_at?->toISOString(),
            'two_factor_enabled'  => $this->isTwoFactorEnabled(),
            'roles'               => $this->getRoleNames(),
            'permissions'         => $this->getAllPermissions()->pluck('name'),
            'last_login_at'       => $this->last_login_at?->toISOString(),
            'created_at'          => $this->created_at->toISOString(),
        ];
    }
}
