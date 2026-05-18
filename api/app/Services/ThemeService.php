<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\StoreTheme;
use App\Models\Tenant;
use App\Models\Theme;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use RuntimeException;

class ThemeService
{
    public function listAvailableThemes(): array
    {
        return Theme::query()
            ->where('is_public', true)
            ->orderBy('name')
            ->get()
            ->map(fn (Theme $theme): array => $this->formatTheme($theme))
            ->all();
    }

    public function getActiveThemePayload(Tenant $tenant): array
    {
        return Cache::remember($this->cacheKey($tenant->id), now()->addMinutes(30), function () use ($tenant): array {
            $storeTheme = $this->activeStoreTheme($tenant);

            if (! $storeTheme) {
                throw new RuntimeException('No active theme has been assigned to this store.');
            }

            $storeTheme->loadMissing('theme');

            if (! $storeTheme->theme) {
                throw new RuntimeException('The active theme metadata is missing.');
            }

            $schema = $this->loadThemeSchema($storeTheme->theme);
            $customConfig = $storeTheme->custom_config ?? [];

            return [
                'store_theme' => $this->formatStoreTheme($storeTheme),
                'theme' => $this->formatTheme($storeTheme->theme),
                'custom_config' => $customConfig,
                'config' => $this->mergeThemeConfig($schema, $customConfig),
            ];
        });
    }

    public function activateTheme(Tenant $tenant, Theme $theme): StoreTheme
    {
        $this->loadThemeSchema($theme);

        $storeTheme = DB::transaction(function () use ($tenant, $theme): StoreTheme {
            $existing = StoreTheme::withoutGlobalScopes()
                ->where('store_id', $tenant->id)
                ->where('theme_id', $theme->id)
                ->first();

            if ($existing) {
                if (! $existing->is_active) {
                    StoreTheme::withoutGlobalScopes()
                        ->where('store_id', $tenant->id)
                        ->where('id', '!=', $existing->id)
                        ->where('is_active', true)
                        ->update(['is_active' => false]);

                    $existing->forceFill([
                        'is_active' => true,
                        'updated_at' => now(),
                    ])->save();
                }

                return $existing;
            }

            StoreTheme::withoutGlobalScopes()
                ->where('store_id', $tenant->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            return StoreTheme::withoutGlobalScopes()->create([
                'store_id' => $tenant->id,
                'theme_id' => $theme->id,
                'is_active' => true,
                'updated_at' => now(),
            ]);
        });

        $storeTheme->loadMissing('theme');

        $this->forgetCachedTheme($tenant->id);

        return $storeTheme;
    }

    public function updateStoreOverrides(Tenant $tenant, array $customConfig): StoreTheme
    {
        $storeTheme = $this->activeStoreTheme($tenant);

        if (! $storeTheme) {
            throw new RuntimeException('No active theme has been assigned to this store.');
        }

        $storeTheme->loadMissing('theme');

        if (! $storeTheme->theme) {
            throw new RuntimeException('The active theme metadata is missing.');
        }

        $schema = $this->loadThemeSchema($storeTheme->theme);
        $this->validateOverridesAgainstSchema($schema, $customConfig);

        $storeTheme->forceFill([
            'custom_config' => $customConfig,
        ])->save();

        $cacheKey = $this->cacheKey($tenant->id);

        $this->forgetCachedTheme($tenant->id);
        Log::info('Theme override cache invalidated.', [
            'tenant_id' => $tenant->id,
            'tenant_slug' => $tenant->slug,
            'cache_key' => $cacheKey,
        ]);

        $this->getActiveThemePayload($tenant);
        Log::info('Theme override cache warmed.', [
            'tenant_id' => $tenant->id,
            'tenant_slug' => $tenant->slug,
            'cache_key' => $cacheKey,
        ]);

        return $storeTheme;
    }

    public function getPreviewThemePayload(Tenant $tenant, Theme $theme): array
    {
        $schema = $this->loadThemeSchema($theme);

        $storeTheme = StoreTheme::withoutGlobalScopes()
            ->with('theme')
            ->where('store_id', $tenant->id)
            ->where('theme_id', $theme->id)
            ->first();

        $customConfig = $storeTheme?->custom_config ?? [];

        return [
            'store_theme' => $storeTheme ? $this->formatStoreTheme($storeTheme) : null,
            'theme' => $this->formatTheme($theme),
            'custom_config' => $customConfig,
            'config' => $this->mergeThemeConfig($schema, $customConfig),
        ];
    }

    private function activeStoreTheme(Tenant $tenant): ?StoreTheme
    {
        return StoreTheme::withoutGlobalScopes()
            ->with('theme')
            ->where('store_id', $tenant->id)
            ->where('is_active', true)
            ->first();
    }

    private function loadThemeSchema(Theme $theme): array
    {
        $schemaPath = $this->themeSchemaPath($theme);

        if (! File::exists($schemaPath)) {
            throw new RuntimeException("Theme schema not found for theme [{$theme->code}].");
        }

        try {
            $decoded = json_decode(File::get($schemaPath), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable $exception) {
            throw new RuntimeException("Theme schema for [{$theme->code}] is invalid JSON.", previous: $exception);
        }

        if (! is_array($decoded)) {
            throw new RuntimeException("Theme schema for [{$theme->code}] must decode to an array.");
        }

        return $decoded;
    }

    private function validateOverridesAgainstSchema(array $schema, array $overrides): void
    {
        $allowedSectionTypes = $this->collectSectionTypes($schema);
        $this->assertOverrideSubset($schema, $overrides, '', $allowedSectionTypes);
    }

    private function assertOverrideSubset(mixed $schemaNode, mixed $overrideNode, string $path, array $allowedSectionTypes): void
    {
        if (! is_array($overrideNode)) {
            return;
        }

        if (! is_array($schemaNode)) {
            throw new InvalidArgumentException($this->formatInvalidPathMessage($path));
        }

        if ($this->isAssociativeArray($overrideNode)) {
            foreach ($overrideNode as $key => $value) {
                if (! array_key_exists($key, $schemaNode)) {
                    throw new InvalidArgumentException($this->formatInvalidPathMessage($this->joinPath($path, (string) $key)));
                }

                if ($key === 'type' && is_string($value) && ! in_array($value, $allowedSectionTypes, true)) {
                    throw new InvalidArgumentException("Section type [{$value}] does not exist in the theme schema.");
                }

                $this->assertOverrideSubset($schemaNode[$key], $value, $this->joinPath($path, (string) $key), $allowedSectionTypes);
            }

            return;
        }

        if ($this->isListArray($schemaNode)) {
            // Empty schema list means the node is intentionally free-form JSON.
            if ($schemaNode === []) {
                return;
            }

            // Single-item schema list acts as a template for all override items.
            if (count($schemaNode) === 1) {
                foreach ($overrideNode as $index => $value) {
                    if (is_array($value) && isset($value['type']) && is_string($value['type']) && ! in_array($value['type'], $allowedSectionTypes, true)) {
                        throw new InvalidArgumentException("Section type [{$value['type']}] does not exist in the theme schema.");
                    }

                    $this->assertOverrideSubset($schemaNode[0], $value, $this->joinPath($path, (string) $index), $allowedSectionTypes);
                }

                return;
            }
        }

        foreach ($overrideNode as $index => $value) {
            if (! array_key_exists($index, $schemaNode)) {
                throw new InvalidArgumentException($this->formatInvalidPathMessage($this->joinPath($path, (string) $index)));
            }

            if (is_array($value) && isset($value['type']) && is_string($value['type']) && ! in_array($value['type'], $allowedSectionTypes, true)) {
                throw new InvalidArgumentException("Section type [{$value['type']}] does not exist in the theme schema.");
            }

            $this->assertOverrideSubset($schemaNode[$index], $value, $this->joinPath($path, (string) $index), $allowedSectionTypes);
        }
    }

    private function collectSectionTypes(array $schema): array
    {
        $types = [];
        $queue = [$schema];

        while ($queue !== []) {
            $node = array_shift($queue);

            if (! is_array($node)) {
                continue;
            }

            foreach ($node as $key => $value) {
                if ($key === 'sections' && is_array($value)) {
                    foreach ($value as $section) {
                        if (is_array($section) && isset($section['type']) && is_string($section['type'])) {
                            $types[] = $section['type'];
                        }

                        $queue[] = $section;
                    }

                    continue;
                }

                if (is_array($value)) {
                    $queue[] = $value;
                }
            }
        }

        return array_values(array_unique($types));
    }

    private function mergeThemeConfig(array $schema, array $overrides): array
    {
        $merged = $schema;

        foreach ($overrides as $key => $value) {
            if (array_key_exists($key, $merged) && is_array($merged[$key]) && is_array($value)) {
                $merged[$key] = $this->mergeThemeConfig($merged[$key], $value);

                continue;
            }

            $merged[$key] = $value;
        }

        if ($this->isListArray($merged)) {
            $merged = array_values($merged);
        }

        return $merged;
    }

    private function formatTheme(Theme $theme): array
    {
        return [
            'id' => $theme->id,
            'name' => $theme->name,
            'code' => $theme->code,
            'version' => $theme->version,
            'preview_image' => $theme->preview_image,
            'is_public' => $theme->is_public,
            'created_at' => $theme->created_at?->toISOString(),
        ];
    }

    private function formatStoreTheme(StoreTheme $storeTheme): array
    {
        return [
            'id' => $storeTheme->id,
            'store_id' => $storeTheme->store_id,
            'theme_id' => $storeTheme->theme_id,
            'is_active' => $storeTheme->is_active,
            'custom_config' => $storeTheme->custom_config ?? [],
            'created_at' => $storeTheme->created_at?->toISOString(),
        ];
    }

    private function themeSchemaPath(Theme $theme): string
    {
        return base_path('themes'.DIRECTORY_SEPARATOR.$theme->code.DIRECTORY_SEPARATOR.'schema.json');
    }

    private function cacheKey(string $tenantId): string
    {
        return 'theme-engine:active:'.$tenantId;
    }

    private function forgetCachedTheme(string $tenantId): void
    {
        Cache::forget($this->cacheKey($tenantId));
    }

    private function isAssociativeArray(array $value): bool
    {
        if ($value === []) {
            return false;
        }

        return array_keys($value) !== range(0, count($value) - 1);
    }

    private function isListArray(array $value): bool
    {
        if ($value === []) {
            return true;
        }

        return array_keys($value) === range(0, count($value) - 1);
    }

    private function joinPath(string $path, string $segment): string
    {
        return $path === '' ? $segment : $path.'.'.$segment;
    }

    private function formatInvalidPathMessage(string $path): string
    {
        return $path === ''
            ? 'The provided theme override contains an invalid key.'
            : "The provided theme override contains an invalid key at [{$path}].";
    }
}
