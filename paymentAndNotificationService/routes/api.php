<?php

use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\TicketController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes Paiements
|--------------------------------------------------------------------------
*/
Route::prefix('payments')->group(function () {
    Route::post('/', [PaymentController::class, 'execute']);
    Route::post('/{payment}/refund', [PaymentController::class, 'refund']);

    Route::get('/', [PaymentController::class, 'userPayments']);
    Route::get('/{payment}', [PaymentController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| Routes Tickets (Billets électroniques)
|--------------------------------------------------------------------------
| Ces routes permettent aux utilisateurs de :
| - Voir leurs tickets après un paiement réussi
| - Afficher/imprimer un ticket avec QR code
| - Valider un ticket (pour les organisateurs)
*/
Route::prefix('tickets')->group(function () {
    // Liste des tickets de l'utilisateur connecté
    Route::get('/me', [TicketController::class, 'myTickets']);
    
    // Détail d'un ticket spécifique
    Route::get('/{ticket_uuid}', [TicketController::class, 'show'])
        ->where('ticket_uuid', '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
    
    // Version imprimable du ticket (HTML avec QR code)
    Route::get('/{ticket_uuid}/print', [TicketController::class, 'print'])
        ->where('ticket_uuid', '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
    
    // Téléchargement PDF du ticket
    Route::get('/{ticket_uuid}/pdf', [TicketController::class, 'downloadPdf'])
        ->where('ticket_uuid', '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
    
    // Validation d'un ticket (scan QR code) - pour les organisateurs
    Route::post('/validate', [TicketController::class, 'validateTicket']);
});

