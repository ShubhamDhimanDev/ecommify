<?php

declare(strict_types=1);

namespace App\Enums;

enum Permission: string
{
    // Products
    case ViewProducts   = 'view_products';
    case CreateProducts = 'create_products';
    case EditProducts   = 'edit_products';
    case DeleteProducts = 'delete_products';

    // Orders
    case ViewOrders   = 'view_orders';
    case ManageOrders = 'manage_orders';

    // Staff
    case ViewStaff   = 'view_staff';
    case ManageStaff = 'manage_staff';

    // Settings
    case ViewSettings   = 'view_settings';
    case ManageSettings = 'manage_settings';

    // Tenants (super admin only)
    case ManageTenants = 'manage_tenants';

    /** Default permissions per role */
    public static function forRole(UserRole $role): array
    {
        return match($role) {
            UserRole::SuperAdmin => array_column(self::cases(), 'value'),

            UserRole::MerchantOwner => [
                self::ViewProducts->value,
                self::CreateProducts->value,
                self::EditProducts->value,
                self::DeleteProducts->value,
                self::ViewOrders->value,
                self::ManageOrders->value,
                self::ViewStaff->value,
                self::ManageStaff->value,
                self::ViewSettings->value,
                self::ManageSettings->value,
            ],

            UserRole::StaffManager => [
                self::ViewProducts->value,
                self::CreateProducts->value,
                self::EditProducts->value,
                self::ViewOrders->value,
                self::ManageOrders->value,
                self::ViewStaff->value,
                self::ViewSettings->value,
            ],

            UserRole::StaffEditor => [
                self::ViewProducts->value,
                self::CreateProducts->value,
                self::EditProducts->value,
                self::ViewOrders->value,
            ],

            UserRole::SupportAgent => [
                self::ViewOrders->value,
                self::ViewProducts->value,
            ],
        };
    }
}
