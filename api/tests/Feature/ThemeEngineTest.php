<?php

declare(strict_types=1);

use App\Models\StoreTheme;
use App\Models\Theme;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->tenantId = (string) Str::uuid();

    DB::table('tenants')->insert([
        'id' => $this->tenantId,
        'name' => 'Acme Store',
        'slug' => 'acme-store',
        'status' => 'active',
        'plan' => null,
        'settings' => json_encode([]),
        'created_at' => now(),
        'updated_at' => now(),
        'data' => json_encode([]),
    ]);

    $this->user = User::factory()->create([
        'tenant_id' => $this->tenantId,
    ]);

    $this->theme = Theme::create([
        'name' => 'Dawn',
        'code' => 'dawn',
        'version' => '1.0.0',
        'preview_image' => null,
        'is_public' => true,
    ]);
});

it('lists public themes', function (): void {
    $response = $this->getJson('/api/v1/themes');

    $response->assertOk();
    $response->assertJsonPath('data.0.code', 'dawn');
});

it('returns active theme payload from public endpoint', function (): void {
    Sanctum::actingAs($this->user);

    $this->postJson('/api/v1/store/acme-store/themes/'.$this->theme->id.'/activate')->assertOk();

    $this->getJson('/api/pub/v1/stores/acme-store/theme')
        ->assertOk()
        ->assertJsonPath('data.theme.code', 'dawn')
        ->assertJsonPath('data.theme_code', 'dawn');
});

it('activates and returns the merged active theme for the current store', function (): void {
    Sanctum::actingAs($this->user);

    $this->postJson('/api/v1/store/acme-store/themes/'.$this->theme->id.'/activate')
        ->assertOk()
        ->assertJsonPath('data.theme.code', 'dawn')
        ->assertJsonPath('data.store_theme.is_active', true);

    StoreTheme::query()->firstOrFail()->forceFill([
        'custom_config' => [
            'pages' => [
                'home' => [
                    'sections' => [
                        [
                            'settings' => [
                                'title' => 'Hello Acme',
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ])->save();

    $this->putJson('/api/v1/store/acme-store/theme/config', [
        'custom_config' => [
            'pages' => [
                'home' => [
                    'sections' => [
                        [
                            'settings' => [
                                'title' => 'Hello Acme',
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ])->assertOk()
        ->assertJsonPath('data.config.pages.home.sections.0.settings.title', 'Hello Acme');

    $this->getJson('/api/v1/store/acme-store/theme')
        ->assertOk()
        ->assertJsonPath('data.config.pages.home.sections.0.settings.title', 'Hello Acme');
});

it('rejects invalid theme override keys', function (): void {
    Sanctum::actingAs($this->user);

    $this->postJson('/api/v1/store/acme-store/themes/'.$this->theme->id.'/activate')->assertOk();

    $this->putJson('/api/v1/store/acme-store/theme/config', [
        'custom_config' => [
            'pages' => [
                'home' => [
                    'sections' => [
                        [
                            'settings' => [
                                'unknown_key' => 'not-allowed',
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ])->assertStatus(422);
});

it('accepts dynamic menu item overrides in header settings', function (): void {
    Sanctum::actingAs($this->user);

    $this->postJson('/api/v1/store/acme-store/themes/'.$this->theme->id.'/activate')->assertOk();

    $this->putJson('/api/v1/store/acme-store/theme/config', [
        'custom_config' => [
            'pages' => [
                'header' => [
                    'sections' => [
                        [
                            'type' => 'mega-menu',
                            'settings' => [
                                'dynamic_menu_items' => [
                                    [
                                        'label' => 'Candle Making',
                                        'href' => '/products?category=candle-making',
                                        'children' => [
                                            [
                                                'label' => 'Wax',
                                                'href' => '/products?category=wax',
                                            ],
                                        ],
                                        'promos' => [],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ])
        ->assertOk()
        ->assertJsonPath('data.config.pages.header.sections.0.settings.dynamic_menu_items.0.label', 'Candle Making');
});

it('switches active themes without violating one-active-per-store constraint', function (): void {
    Sanctum::actingAs($this->user);

    $candlescience = Theme::create([
        'name' => 'CandleScience',
        'code' => 'candlescience',
        'version' => '1.0.0',
        'preview_image' => null,
        'is_public' => true,
    ]);

    $this->postJson('/api/v1/store/acme-store/themes/'.$this->theme->id.'/activate')
        ->assertOk()
        ->assertJsonPath('data.theme.code', 'dawn');

    $this->postJson('/api/v1/store/acme-store/themes/'.$candlescience->id.'/activate')
        ->assertOk()
        ->assertJsonPath('data.theme.code', 'candlescience')
        ->assertJsonPath('data.store_theme.is_active', true);

    expect(
        StoreTheme::withoutGlobalScopes()
            ->where('store_id', $this->tenantId)
            ->where('is_active', true)
            ->count()
    )->toBe(1);

    $this->getJson('/api/v1/store/acme-store/theme')
        ->assertOk()
        ->assertJsonPath('data.theme.code', 'candlescience');
});
