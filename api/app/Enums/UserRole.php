<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin    = 'super_admin';
    case MerchantOwner = 'merchant_owner';
    case StaffManager  = 'staff_manager';
    case StaffEditor   = 'staff_editor';
    case SupportAgent  = 'support_agent';

    public function label(): string
    {
        return match($this) {
            self::SuperAdmin    => 'Super Admin',
            self::MerchantOwner => 'Merchant Owner',
            self::StaffManager  => 'Staff Manager',
            self::StaffEditor   => 'Staff Editor',
            self::SupportAgent  => 'Support Agent',
        };
    }

    /** Roles that operate only within a specific tenant */
    public function isTenantScoped(): bool
    {
        return match($this) {
            self::SuperAdmin    => false,
            default             => true,
        };
    }

    public static function tenantRoles(): array
    {
        return array_filter(
            self::cases(),
            fn (self $role) => $role->isTenantScoped()
        );
    }
}
