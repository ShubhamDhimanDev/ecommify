<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_themes', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('store_id');
            $table->foreign('store_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->uuid('theme_id');
            $table->foreign('theme_id')->references('id')->on('themes')->cascadeOnDelete();
            $table->boolean('is_active')->default(false);
            $table->jsonb('custom_config')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();

            $table->unique(['store_id', 'theme_id']);
            $table->index('store_id');
        });

        DB::statement('CREATE UNIQUE INDEX store_themes_one_active_per_store ON store_themes (store_id) WHERE is_active');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS store_themes_one_active_per_store');
        Schema::dropIfExists('store_themes');
    }
};
