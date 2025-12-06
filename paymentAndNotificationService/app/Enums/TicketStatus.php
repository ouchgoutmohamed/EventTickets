<?php

namespace App\Enums;

/**
 * Énumération des statuts possibles d'un ticket électronique.
 */
enum TicketStatus: string
{
    // Ticket généré et valide, prêt à être utilisé
    case GENERATED = 'Generated';
    
    // Ticket utilisé (scanné à l'entrée)
    case USED = 'Used';
    
    // Ticket annulé (remboursement, etc.)
    case CANCELED = 'Canceled';
    
    // Ticket expiré (événement passé sans utilisation)
    case EXPIRED = 'Expired';
    
    /**
     * Vérifie si le ticket peut être utilisé.
     */
    public function isUsable(): bool
    {
        return $this === self::GENERATED;
    }
    
    /**
     * Retourne une description lisible du statut.
     */
    public function description(): string
    {
        return match($this) {
            self::GENERATED => 'Valide',
            self::USED => 'Utilisé',
            self::CANCELED => 'Annulé',
            self::EXPIRED => 'Expiré',
        };
    }
    
    /**
     * Retourne la couleur associée au statut (pour l'UI).
     */
    public function color(): string
    {
        return match($this) {
            self::GENERATED => 'green',
            self::USED => 'blue',
            self::CANCELED => 'red',
            self::EXPIRED => 'gray',
        };
    }
}
