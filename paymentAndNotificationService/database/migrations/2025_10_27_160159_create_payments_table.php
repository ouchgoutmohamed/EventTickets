<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->uuid("transaction_id")->nullable();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('event_id');
            $table->unsignedBigInteger('ticket_id');
            $table->unsignedInteger('amount');
            $table->string('currency', 10)->default('MAD');
            $table->enum('status', PaymentStatus::cases())->default(PaymentStatus::PENDING->value);
            $table->enum('method', PaymentMethod::cases());
            $table->text('reason')->nullable();
            $table->string('provider', 50)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
