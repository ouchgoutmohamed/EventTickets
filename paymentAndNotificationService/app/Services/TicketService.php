<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\Payment;
use App\Enums\PaymentStatus;
use App\Enums\TicketStatus;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Exception;

/**
 * Service de gestion des tickets électroniques.
 * 
 * Ce service est responsable de :
 * - La génération de tickets après un paiement réussi
 * - La récupération des tickets d'un utilisateur
 * - La validation et l'utilisation des tickets (scan QR)
 * - La communication avec les autres microservices pour enrichir les données
 */
class TicketService
{
    /**
     * URL du service EventCatalog pour récupérer les infos d'événements.
     */
    protected string $eventServiceUrl;

    /**
     * URL du service User pour récupérer les infos utilisateur.
     */
    protected string $userServiceUrl;

    public function __construct()
    {
        $this->eventServiceUrl = config('services.event_catalog.url', 'http://event-catalog:8080');
        $this->userServiceUrl = config('services.user_service.url', 'http://user-service:3001');
    }

    /**
     * Génère un ticket après un paiement réussi.
     * 
     * Cette méthode est idempotente : si un ticket existe déjà pour ce paiement,
     * elle retourne le ticket existant sans en créer un nouveau.
     *
     * @param Payment $payment Le paiement validé
     * @return Ticket Le ticket généré ou existant
     * @throws Exception Si le paiement n'est pas valide
     */
    public function generateTicketForPayment(Payment $payment): Ticket
    {
        // Vérifier que le paiement est bien en succès
        if ($payment->status !== PaymentStatus::SUCCESS->value && $payment->status !== PaymentStatus::SUCCESS) {
            throw new Exception('Cannot generate ticket for non-successful payment');
        }

        // Vérifier l'idempotence : un ticket existe-t-il déjà pour ce paiement ?
        $existingTicket = Ticket::where('payment_id', $payment->id)->first();
        if ($existingTicket) {
            Log::info("🎫 Ticket existant trouvé pour le paiement #{$payment->id}", [
                'ticket_uuid' => $existingTicket->ticket_uuid
            ]);
            return $existingTicket;
        }

        // Générer les identifiants uniques
        $ticketUuid = Str::uuid()->toString();
        $qrPayload = $this->generateQrPayload($ticketUuid, $payment);

        // Créer le ticket
        $ticket = Ticket::create([
            'ticket_uuid' => $ticketUuid,
            'user_id' => $payment->user_id,
            'event_id' => $payment->event_id,
            'payment_id' => $payment->id,
            'reservation_id' => $payment->reservation_id,
            'qr_payload' => $qrPayload,
            'ticket_type' => $this->determineTicketType($payment),
            'quantity' => 1, // On peut étendre pour supporter plusieurs tickets
            'unit_price' => $payment->amount,
            'status' => TicketStatus::GENERATED,
        ]);

        Log::info("🎫 Nouveau ticket généré", [
            'ticket_uuid' => $ticketUuid,
            'payment_id' => $payment->id,
            'user_id' => $payment->user_id,
            'event_id' => $payment->event_id,
        ]);

        return $ticket;
    }

    /**
     * Génère le payload du QR code.
     * 
     * Le payload contient les informations nécessaires pour valider le ticket
     * lors du scan. Il peut être signé pour plus de sécurité.
     *
     * @param string $ticketUuid UUID du ticket
     * @param Payment $payment Paiement associé
     * @return string Payload encodé
     */
    protected function generateQrPayload(string $ticketUuid, Payment $payment): string
    {
        // Données à encoder dans le QR code
        $data = [
            'ticket_uuid' => $ticketUuid,
            'event_id' => $payment->event_id,
            'user_id' => $payment->user_id,
            'timestamp' => now()->timestamp,
        ];

        // Encoder en base64 avec une signature simple (HMAC)
        $jsonData = json_encode($data);
        $signature = hash_hmac('sha256', $jsonData, config('app.key'));
        
        // Format: base64(json).signature
        return base64_encode($jsonData) . '.' . substr($signature, 0, 16);
    }

    /**
     * Détermine le type de ticket basé sur le paiement.
     *
     * @param Payment $payment
     * @return string
     */
    protected function determineTicketType(Payment $payment): string
    {
        // Pour l'instant, retourne un type par défaut
        // On pourrait étendre cela pour supporter VIP, Standard, etc.
        return 'Standard';
    }

    /**
     * Récupère tous les tickets d'un utilisateur.
     *
     * @param int $userId ID de l'utilisateur
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getUserTickets(int $userId)
    {
        return Ticket::forUser($userId)
            ->with('payment')
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Récupère un ticket par son UUID.
     *
     * @param string $ticketUuid UUID du ticket
     * @return Ticket|null
     */
    public function getTicketByUuid(string $ticketUuid): ?Ticket
    {
        return Ticket::where('ticket_uuid', $ticketUuid)->first();
    }

    /**
     * Récupère les informations complètes d'un ticket pour l'affichage/impression.
     * 
     * Cette méthode enrichit le ticket avec les données des autres microservices
     * (informations de l'événement, de l'utilisateur, etc.)
     *
     * @param Ticket $ticket Le ticket à enrichir
     * @return array Données complètes du ticket
     */
    public function getTicketFullDetails(Ticket $ticket): array
    {
        // Récupérer les infos de l'événement depuis EventCatalogService
        $eventInfo = $this->fetchEventInfo($ticket->event_id);
        
        // Récupérer les infos de l'utilisateur depuis UserService
        $userInfo = $this->fetchUserInfo($ticket->user_id);

        return [
            'ticket' => [
                'uuid' => $ticket->ticket_uuid,
                'type' => $ticket->ticket_type,
                'quantity' => $ticket->quantity,
                'unit_price' => $ticket->unit_price,
                'total_price' => $ticket->total_price,
                'status' => $ticket->status->value,
                'status_description' => $ticket->status->description(),
                'status_color' => $ticket->status->color(),
                'qr_payload' => $ticket->qr_payload,
                'created_at' => $ticket->created_at->toIso8601String(),
                'used_at' => $ticket->used_at?->toIso8601String(),
            ],
            'event' => $eventInfo,
            'user' => $userInfo,
            'payment' => [
                'id' => $ticket->payment_id,
                'transaction_id' => $ticket->payment?->transaction_id,
            ],
        ];
    }

    /**
     * Récupère les informations d'un événement depuis EventCatalogService.
     *
     * @param int $eventId ID de l'événement
     * @return array
     */
    protected function fetchEventInfo(int $eventId): array
    {
        try {
            // EventCatalogService utilise /events/{id} sans préfixe /api
            $response = Http::timeout(5)->get("{$this->eventServiceUrl}/events/{$eventId}");
            
            if ($response->successful()) {
                $data = $response->json();
                
                // Extraire le lieu depuis l'objet venue ou le champ location
                $location = 'Non spécifié';
                if (isset($data['venue']) && is_array($data['venue'])) {
                    $venue = $data['venue'];
                    $location = trim(($venue['name'] ?? '') . ', ' . ($venue['city'] ?? ''));
                    $location = rtrim($location, ', ') ?: 'Non spécifié';
                } elseif (isset($data['location'])) {
                    $location = $data['location'];
                }

                // Extraire la catégorie depuis l'objet category
                $category = null;
                if (isset($data['category']) && is_array($data['category'])) {
                    $category = $data['category']['name'] ?? null;
                } elseif (isset($data['category']) && is_string($data['category'])) {
                    $category = $data['category'];
                }

                // Extraire l'image principale
                $image = null;
                if (isset($data['images']) && is_array($data['images']) && count($data['images']) > 0) {
                    $image = $data['images'][0]['imageUrl'] ?? $data['images'][0]['url'] ?? null;
                } elseif (isset($data['image'])) {
                    $image = $data['image'];
                }

                return [
                    'id' => $eventId,
                    'title' => $data['title'] ?? $data['name'] ?? 'Événement',
                    'description' => $data['description'] ?? '',
                    'date' => $data['date'] ?? $data['eventDate'] ?? null,
                    'time' => $data['startTime'] ?? $data['time'] ?? null,
                    'location' => $location,
                    'category' => $category,
                    'image' => $image,
                ];
            }
        } catch (Exception $e) {
            Log::warning("Impossible de récupérer les infos de l'événement #{$eventId}: " . $e->getMessage());
        }

        // Retourner des données par défaut si l'appel échoue
        return [
            'id' => $eventId,
            'title' => "Événement #{$eventId}",
            'description' => '',
            'date' => null,
            'time' => null,
            'location' => 'Non spécifié',
            'category' => null,
            'image' => null,
        ];
    }

    /**
     * Récupère les informations d'un utilisateur depuis UserService.
     *
     * @param int $userId ID de l'utilisateur
     * @return array
     */
    protected function fetchUserInfo(int $userId): array
    {
        try {
            $response = Http::timeout(5)->get("{$this->userServiceUrl}/api/users/{$userId}");
            
            if ($response->successful()) {
                $data = $response->json();
                $userData = $data['data'] ?? $data;
                return [
                    'id' => $userId,
                    'name' => $userData['name'] ?? $userData['firstName'] . ' ' . ($userData['lastName'] ?? ''),
                    'email' => $userData['email'] ?? '',
                ];
            }
        } catch (Exception $e) {
            Log::warning("Impossible de récupérer les infos de l'utilisateur #{$userId}: " . $e->getMessage());
        }

        // Retourner des données par défaut si l'appel échoue
        return [
            'id' => $userId,
            'name' => "Utilisateur #{$userId}",
            'email' => '',
        ];
    }

    /**
     * Valide et marque un ticket comme utilisé (scan QR code).
     *
     * @param string $qrPayload Payload du QR code scanné
     * @return array Résultat de la validation
     */
    public function validateAndUseTicket(string $qrPayload): array
    {
        // Trouver le ticket par son QR payload
        $ticket = Ticket::where('qr_payload', $qrPayload)->first();

        if (!$ticket) {
            return [
                'success' => false,
                'message' => 'Ticket non trouvé',
                'code' => 'TICKET_NOT_FOUND',
            ];
        }

        if (!$ticket->isUsable()) {
            return [
                'success' => false,
                'message' => "Ce ticket ne peut pas être utilisé (statut: {$ticket->status->description()})",
                'code' => 'TICKET_NOT_USABLE',
                'status' => $ticket->status->value,
            ];
        }

        // Marquer le ticket comme utilisé
        $ticket->markAsUsed();

        return [
            'success' => true,
            'message' => 'Ticket validé avec succès',
            'ticket' => [
                'uuid' => $ticket->ticket_uuid,
                'event_id' => $ticket->event_id,
                'used_at' => $ticket->used_at->toIso8601String(),
            ],
        ];
    }
}
