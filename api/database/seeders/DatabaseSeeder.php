<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            SuperAdminSeeder::class,
            UserSeeder::class,
            MerchantSeeder::class,
            ProductSeeder::class,
            DefaultThemeSeeder::class,
        ]);
    }
}
