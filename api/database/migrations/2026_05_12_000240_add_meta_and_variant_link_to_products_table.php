<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->uuid('parent_product_id')->nullable()->after('category_id');
            $table->boolean('is_variant')->default(false)->after('parent_product_id');
            $table->string('meta_title')->nullable()->after('hs_code');
            $table->text('meta_description')->nullable()->after('meta_title');
            $table->json('meta_keywords')->nullable()->after('meta_description');

            $table->foreign('parent_product_id')
                ->references('id')
                ->on('products')
                ->nullOnDelete();

            $table->index(['tenant_id', 'parent_product_id']);
            $table->index(['tenant_id', 'is_variant']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->dropIndex(['tenant_id', 'is_variant']);
            $table->dropIndex(['tenant_id', 'parent_product_id']);
            $table->dropForeign(['parent_product_id']);

            $table->dropColumn([
                'parent_product_id',
                'is_variant',
                'meta_title',
                'meta_description',
                'meta_keywords',
            ]);
        });
    }
};
