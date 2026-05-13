<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('tenant_id');
            $table->uuid('order_id')->nullable();

            $table->string('gateway')->nullable();
            $table->string('gateway_transaction_id')->nullable();
            $table->string('status')->default('pending');

            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->decimal('refunded_amount', 12, 2)->default(0);

            $table->string('customer_email')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('description')->nullable();

            $table->json('metadata')->nullable();
            $table->string('error_code')->nullable();
            $table->text('error_message')->nullable();

            $table->timestamp('paid_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->nullOnDelete();

            $table->index(['tenant_id', 'status']);
            $table->index('gateway_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
