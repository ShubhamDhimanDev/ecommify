<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('tenant_id')->nullable()->after('id');
            $table->string('avatar')->nullable()->after('name');
            $table->string('phone', 30)->nullable()->after('email');
            $table->string('status')->default('active')->after('phone'); // active | suspended | invited
            $table->timestamp('last_login_at')->nullable()->after('remember_token');

            $table->foreign('tenant_id')->references('id')->on('tenants')->onUpdate('cascade')->onDelete('set null');
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropIndex(['tenant_id']);
            $table->dropColumn(['tenant_id', 'avatar', 'phone', 'status', 'last_login_at']);
        });
    }
};
