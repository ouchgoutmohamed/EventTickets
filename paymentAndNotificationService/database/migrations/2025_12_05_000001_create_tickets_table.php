<?php

use App\Enums\TicketStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration pour créer la table des billets électroniques.
 * Cette table stocke les tickets générés après un paiement réussi.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            
            // UUID public unique pour identifier le ticket (utilisé dans les URLs et QR codes)
            $table->uuid('ticket_uuid')->unique();
            
            // Références aux autres entités
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('event_id')->index();
            $table->unsignedBigInteger('payment_id')->index();
            $table->unsignedBigInteger('reservation_id')->nullable()->index();
            
            // Payload du QR code (token signé ou données encodées)
            $table->string('qr_payload', 500)->unique();
            
            // Informations du ticket
            $table->string('ticket_type')->nullable(); // VIP, Standard, etc.
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('unit_price')->default(0);
            
            // Statut du ticket
            $table->enum('status', array_column(TicketStatus::cases(), 'value'))
                  ->default(TicketStatus::GENERATED->value);
            
            // Date d'utilisation (scan du QR code)
            $table->timestamp('used_at')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Index composites pour les requêtes fréquentes
            $table->index(['user_id', 'status']);
            $table->index(['event_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
