<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->string('application_type')->default('order')->after('value');
            $table->string('target_type')->default('all')->after('application_type');
            $table->json('target_ids')->nullable()->after('target_type');
            $table->json('applicable_days')->nullable()->after('target_ids');
            $table->unsignedInteger('buy_quantity')->nullable()->after('applicable_days');
            $table->unsignedInteger('get_quantity')->nullable()->after('buy_quantity');
        });
    }

    public function down(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->dropColumn([
                'application_type',
                'target_type',
                'target_ids',
                'applicable_days',
                'buy_quantity',
                'get_quantity',
            ]);
        });
    }
};
