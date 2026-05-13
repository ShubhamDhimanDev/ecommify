<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration for Store Payment Gateway Configuration
 *
 * Creates table to store each store's OAuth-connected payment gateway
 * credentials and configurations.
 *
 * Example schema migration:
 * php artisan make:migration create_store_payment_gateways_table
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('store_payment_gateways', function (Blueprint $table) {
            $table->id();

            // Tenant reference
            $table->string('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');

            // Gateway name (stripe, paypal, razorpay)
            $table->string('gateway');

            // OAuth credentials
            $table->text('oauth_token')->nullable();
            $table->text('oauth_refresh_token')->nullable();

            // Gateway account identifier
            $table->string('gateway_account_id')->nullable();

            // Status
            $table->boolean('is_active')->default(true);
            $table->dateTime('connected_at')->nullable();
            $table->dateTime('last_refreshed_at')->nullable();

            // Additional metadata (JSON)
            $table->json('metadata')->nullable();

            $table->timestamps();

            // Indices
            $table->unique(['tenant_id', 'gateway']);
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_payment_gateways');
    }
};
