<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DefaultThemeSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $themes = [
            [
                'name' => 'Dawn',
                'code' => 'dawn',
                'version' => '1.0.0',
                'preview_image' => null,
                'is_public' => 1,
            ],
            [
                'name' => 'CandleScience',
                'code' => 'candlescience',
                'version' => '1.0.0',
                'preview_image' => null,
                'is_public' => 1,
            ],
        ];

        foreach ($themes as $themeData) {
            $exists = DB::table('themes')->where('code', $themeData['code'])->exists();

            if ($exists) {
                continue;
            }

            DB::table('themes')->insert([
                'id' => (string) Str::uuid(),
                'name' => $themeData['name'],
                'code' => $themeData['code'],
                'version' => $themeData['version'],
                'preview_image' => $themeData['preview_image'],
                'is_public' => $themeData['is_public'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
