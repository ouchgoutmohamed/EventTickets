<?php

namespace App\Models;

use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modèle Eloquent pour les tickets électroniques.
 * 
 * Un ticket est généré après un paiement réussi et contient
 * un QR code unique permettant l'accès à l'événement.
 */
class Ticket extends Model
{
    use HasFactory;

    /**
     * Les attributs qui peuvent être assignés en masse.
     */
    protected $fillable = [
        'ticket_uuid',
        'user_id',
        'event_id',
        'payment_id',
        'reservation_id',
        'qr_payload',
        'ticket_type',
        'quantity',
        'unit_price',
        'status',
        'used_at',
    ];

    /**
     * Les attributs qui doivent être castés.
     */
    protected function casts(): array
    {
        return [
            'status' => TicketStatus::class,
            'used_at' => 'datetime',
            'quantity' => 'integer',
            'unit_price' => 'integer',
        ];
    }

    /**
     * Relation avec le paiement associé.
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * Vérifie si le ticket peut être utilisé (scanné).
     */
    public function isUsable(): bool
    {
        return $this->status === TicketStatus::GENERATED;
    }

    /**
     * Marque le ticket comme utilisé.
     */
    public function markAsUsed(): bool
    {
        if (!$this->isUsable()) {
            return false;
        }

        return $this->update([
            'status' => TicketStatus::USED,
            'used_at' => now(),
        ]);
    }

    /**
     * Annule le ticket.
     */
    public function cancel(): bool
    {
        if ($this->status === TicketStatus::USED) {
            return false; // Impossible d'annuler un ticket déjà utilisé
        }

        return $this->update([
            'status' => TicketStatus::CANCELED,
        ]);
    }

    /**
     * Scope pour les tickets d'un utilisateur.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope pour les tickets valides (générés).
     */
    public function scopeValid($query)
    {
        return $query->where('status', TicketStatus::GENERATED);
    }

    /**
     * Calcule le prix total du ticket.
     */
    public function getTotalPriceAttribute(): int
    {
        return $this->quantity * $this->unit_price;
    }

    /**
     * Génère l'URL pour le billet imprimable.
     */
    public function getPrintUrlAttribute(): string
    {
        return url("/api/tickets/{$this->ticket_uuid}/print");
    }
}
