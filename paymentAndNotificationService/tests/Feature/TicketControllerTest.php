<?php

namespace Tests\Feature;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\TicketStatus;
use App\Models\Payment;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests pour les fonctionnalités de tickets électroniques.
 * 
 * Ces tests vérifient :
 * - La génération automatique de tickets après paiement
 * - L'idempotence (pas de doublon)
 * - La sécurité d'accès aux tickets
 * - Les endpoints API
 */
class TicketControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: Un ticket est créé automatiquement après un paiement réussi.
     */
    public function test_ticket_is_generated_after_successful_payment(): void
    {
        // Créer un paiement réussi
        $payment = Payment::create([
            'user_id' => 1,
            'event_id' => 10,
            'ticket_id' => 100,
            'amount' => 500,
            'currency' => 'MAD',
            'method' => PaymentMethod::CREDIT_CARD->value,
            'status' => PaymentStatus::SUCCESS->value,
            'transaction_id' => 'test-txn-123',
        ]);

        // Générer le ticket via le service
        $ticketService = app(TicketService::class);
        $ticket = $ticketService->generateTicketForPayment($payment);

        // Vérifications
        $this->assertNotNull($ticket);
        $this->assertEquals($payment->id, $ticket->payment_id);
        $this->assertEquals($payment->user_id, $ticket->user_id);
        $this->assertEquals($payment->event_id, $ticket->event_id);
        $this->assertNotEmpty($ticket->ticket_uuid);
        $this->assertNotEmpty($ticket->qr_payload);
        $this->assertEquals(TicketStatus::GENERATED, $ticket->status);
    }

    /**
     * Test: L'idempotence - pas de doublon de ticket pour le même paiement.
     */
    public function test_no_duplicate_ticket_for_same_payment(): void
    {
        $payment = Payment::create([
            'user_id' => 1,
            'event_id' => 10,
            'ticket_id' => 100,
            'amount' => 500,
            'currency' => 'MAD',
            'method' => PaymentMethod::CREDIT_CARD->value,
            'status' => PaymentStatus::SUCCESS->value,
            'transaction_id' => 'test-txn-456',
        ]);

        $ticketService = app(TicketService::class);
        
        // Générer le ticket une première fois
        $ticket1 = $ticketService->generateTicketForPayment($payment);
        
        // Tenter de générer à nouveau - doit retourner le même ticket
        $ticket2 = $ticketService->generateTicketForPayment($payment);

        $this->assertEquals($ticket1->id, $ticket2->id);
        $this->assertEquals($ticket1->ticket_uuid, $ticket2->ticket_uuid);
        
        // Vérifier qu'il n'y a qu'un seul ticket en base
        $this->assertEquals(1, Ticket::where('payment_id', $payment->id)->count());
    }

    /**
     * Test: Récupérer les tickets d'un utilisateur via l'API.
     */
    public function test_user_can_get_their_tickets(): void
    {
        // Créer un paiement et un ticket
        $payment = Payment::create([
            'user_id' => 42,
            'event_id' => 10,
            'ticket_id' => 100,
            'amount' => 500,
            'currency' => 'MAD',
            'method' => PaymentMethod::CREDIT_CARD->value,
            'status' => PaymentStatus::SUCCESS->value,
            'transaction_id' => 'test-txn-789',
        ]);

        $ticketService = app(TicketService::class);
        $ticket = $ticketService->generateTicketForPayment($payment);

        // Appeler l'API avec le header X-User-Id
        $response = $this->withHeaders([
            'X-User-Id' => '42',
        ])->getJson('/api/tickets/me');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         '*' => [
                             'id',
                             'ticket_uuid',
                             'event_id',
                             'status',
                             'qr_payload',
                         ]
                     ],
                     'count',
                 ]);

        $this->assertEquals(1, $response->json('count'));
    }

    /**
     * Test: Un utilisateur ne peut pas voir les tickets d'un autre utilisateur.
     */
    public function test_user_cannot_access_other_users_tickets(): void
    {
        // Créer un paiement pour l'utilisateur 1
        $payment = Payment::create([
            'user_id' => 1,
            'event_id' => 10,
            'ticket_id' => 100,
            'amount' => 500,
            'currency' => 'MAD',
            'method' => PaymentMethod::CREDIT_CARD->value,
            'status' => PaymentStatus::SUCCESS->value,
            'transaction_id' => 'test-txn-sec',
        ]);

        $ticketService = app(TicketService::class);
        $ticket = $ticketService->generateTicketForPayment($payment);

        // L'utilisateur 2 essaie d'accéder au ticket de l'utilisateur 1
        $response = $this->withHeaders([
            'X-User-Id' => '2',
        ])->getJson("/api/tickets/{$ticket->ticket_uuid}");

        $response->assertStatus(403);
    }

    /**
     * Test: Récupérer le détail d'un ticket.
     */
    public function test_get_ticket_details(): void
    {
        $payment = Payment::create([
            'user_id' => 5,
            'event_id' => 20,
            'ticket_id' => 200,
            'amount' => 750,
            'currency' => 'MAD',
            'method' => PaymentMethod::CREDIT_CARD->value,
            'status' => PaymentStatus::SUCCESS->value,
            'transaction_id' => 'test-txn-detail',
        ]);

        $ticketService = app(TicketService::class);
        $ticket = $ticketService->generateTicketForPayment($payment);

        $response = $this->withHeaders([
            'X-User-Id' => '5',
        ])->getJson("/api/tickets/{$ticket->ticket_uuid}");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'ticket' => [
                             'uuid',
                             'type',
                             'status',
                             'qr_payload',
                         ],
                         'event',
                         'user',
                         'payment',
                     ],
                 ]);
    }

    /**
     * Test: La page d'impression du ticket est accessible.
     */
    public function test_ticket_print_page_is_accessible(): void
    {
        $payment = Payment::create([
            'user_id' => 10,
            'event_id' => 30,
            'ticket_id' => 300,
            'amount' => 1000,
            'currency' => 'MAD',
            'method' => PaymentMethod::CREDIT_CARD->value,
            'status' => PaymentStatus::SUCCESS->value,
            'transaction_id' => 'test-txn-print',
        ]);

        $ticketService = app(TicketService::class);
        $ticket = $ticketService->generateTicketForPayment($payment);

        // La page d'impression doit être accessible (retourne du HTML)
        $response = $this->get("/api/tickets/{$ticket->ticket_uuid}/print");

        $response->assertStatus(200);
        // Vérifier que c'est bien du HTML
        $this->assertStringContainsString('<!DOCTYPE html>', $response->getContent());
        $this->assertStringContainsString('Billet d\'entrée', $response->getContent());
    }

    /**
     * Test: Validation d'un ticket (scan QR code).
     */
    public function test_ticket_validation(): void
    {
        $payment = Payment::create([
            'user_id' => 15,
            'event_id' => 40,
            'ticket_id' => 400,
            'amount' => 1200,
            'currency' => 'MAD',
            'method' => PaymentMethod::CREDIT_CARD->value,
            'status' => PaymentStatus::SUCCESS->value,
            'transaction_id' => 'test-txn-validate',
        ]);

        $ticketService = app(TicketService::class);
        $ticket = $ticketService->generateTicketForPayment($payment);

        // Valider le ticket
        $response = $this->postJson('/api/tickets/validate', [
            'qr_payload' => $ticket->qr_payload,
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Ticket validé avec succès',
                 ]);

        // Vérifier que le ticket est maintenant utilisé
        $ticket->refresh();
        $this->assertEquals(TicketStatus::USED, $ticket->status);
        $this->assertNotNull($ticket->used_at);
    }

    /**
     * Test: Un ticket déjà utilisé ne peut pas être validé à nouveau.
     */
    public function test_used_ticket_cannot_be_validated_again(): void
    {
        $payment = Payment::create([
            'user_id' => 20,
            'event_id' => 50,
            'ticket_id' => 500,
            'amount' => 800,
            'currency' => 'MAD',
            'method' => PaymentMethod::CREDIT_CARD->value,
            'status' => PaymentStatus::SUCCESS->value,
            'transaction_id' => 'test-txn-double',
        ]);

        $ticketService = app(TicketService::class);
        $ticket = $ticketService->generateTicketForPayment($payment);

        // Première validation - succès
        $response1 = $this->postJson('/api/tickets/validate', [
            'qr_payload' => $ticket->qr_payload,
        ]);
        $response1->assertStatus(200);

        // Deuxième validation - échec
        $response2 = $this->postJson('/api/tickets/validate', [
            'qr_payload' => $ticket->qr_payload,
        ]);
        $response2->assertStatus(400)
                  ->assertJson([
                      'success' => false,
                      'code' => 'TICKET_NOT_USABLE',
                  ]);
    }

    /**
     * Test: Erreur 404 pour un ticket inexistant.
     */
    public function test_404_for_nonexistent_ticket(): void
    {
        $response = $this->withHeaders([
            'X-User-Id' => '1',
        ])->getJson('/api/tickets/00000000-0000-0000-0000-000000000000');

        $response->assertStatus(404);
    }

    /**
     * Test: Le QR payload est unique pour chaque ticket.
     */
    public function test_qr_payload_is_unique(): void
    {
        // Créer deux paiements différents
        $payment1 = Payment::create([
            'user_id' => 1,
            'event_id' => 10,
            'ticket_id' => 100,
            'amount' => 500,
            'currency' => 'MAD',
            'method' => PaymentMethod::CREDIT_CARD->value,
            'status' => PaymentStatus::SUCCESS->value,
            'transaction_id' => 'test-txn-unique-1',
        ]);

        $payment2 = Payment::create([
            'user_id' => 2,
            'event_id' => 10,
            'ticket_id' => 100,
            'amount' => 500,
            'currency' => 'MAD',
            'method' => PaymentMethod::CREDIT_CARD->value,
            'status' => PaymentStatus::SUCCESS->value,
            'transaction_id' => 'test-txn-unique-2',
        ]);

        $ticketService = app(TicketService::class);
        $ticket1 = $ticketService->generateTicketForPayment($payment1);
        $ticket2 = $ticketService->generateTicketForPayment($payment2);

        $this->assertNotEquals($ticket1->qr_payload, $ticket2->qr_payload);
        $this->assertNotEquals($ticket1->ticket_uuid, $ticket2->ticket_uuid);
    }
}
