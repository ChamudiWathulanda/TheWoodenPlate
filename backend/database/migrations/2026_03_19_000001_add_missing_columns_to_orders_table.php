<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_number')->unique()->after('customer_id');
            $table->string('customer_name')->nullable()->after('order_number');
            $table->string('customer_phone')->nullable()->after('customer_name');
            $table->string('customer_email')->nullable()->after('customer_phone');
            $table->enum('order_type', ['dine-in', 'takeaway', 'delivery'])->nullable()->after('customer_email');
            $table->string('delivery_address')->nullable()->after('order_type');
            $table->decimal('subtotal', 10, 2)->default(0)->after('delivery_address');
            $table->decimal('discount', 10, 2)->default(0)->after('subtotal');
            $table->decimal('total', 10, 2)->default(0)->after('discount');
            $table->text('special_instructions')->nullable()->after('total');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'order_number',
                'customer_name',
                'customer_phone',
                'customer_email',
                'order_type',
                'delivery_address',
                'subtotal',
                'discount',
                'total',
                'special_instructions'
            ]);
        });
    }
};
