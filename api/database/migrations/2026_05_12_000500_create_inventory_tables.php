<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_stocks', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('tenant_id');
            $table->uuid('item_id');
            $table->integer('quantity')->default(0);
            $table->boolean('allow_negative')->default(false);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->unique(['tenant_id', 'item_id']);
        });

        Schema::create('inventory_compositions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('tenant_id');
            $table->uuid('item_id');
            $table->uuid('component_item_id');
            $table->decimal('quantity_per_unit', 12, 4)->default(1);
            $table->string('purpose')->default('production');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'item_id']);
        });

        Schema::create('inventory_operations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('tenant_id');
            $table->string('operation_type');
            $table->string('reference')->nullable();
            $table->text('reason')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::create('inventory_operation_lines', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('operation_id');
            $table->string('tenant_id');
            $table->uuid('item_id');
            $table->decimal('delta', 12, 4);
            $table->decimal('before_qty', 12, 4);
            $table->decimal('after_qty', 12, 4);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('operation_id')->references('id')->on('inventory_operations')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['operation_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_operation_lines');
        Schema::dropIfExists('inventory_operations');
        Schema::dropIfExists('inventory_compositions');
        Schema::dropIfExists('inventory_stocks');
    }
};
