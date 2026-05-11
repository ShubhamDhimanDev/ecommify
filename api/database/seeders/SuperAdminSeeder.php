<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('SUPER_ADMIN_EMAIL', 'admin@platform.com');

        $admin = User::firstOrCreate(
            ['email' => $email],
            [
                'name'              => 'Platform Admin',
                'password'          => Hash::make(env('SUPER_ADMIN_PASSWORD', 'secret')),
                'tenant_id'         => null,
                'email_verified_at' => now(),
            ]
        );

        $admin->assignRole(UserRole::SuperAdmin->value);

        $this->command->info("Super admin [{$email}] seeded.");
    }
}
