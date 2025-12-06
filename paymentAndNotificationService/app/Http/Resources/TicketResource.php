<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * Resource pour formater les données d'un ticket en JSON.
 */
class TicketResource extends JsonResource
{
    /**
     * Récupère les informations d'un événement depuis EventCatalogService.
     *
     * @param int $eventId ID de l'événement
     * @return array
     */
    protected function fetchEventInfo(int $eventId): array
    {
        // Utiliser le cache pour éviter les appels répétés
        return Cache::remember("event_info_{$eventId}", 300, function () use ($eventId) {
            try {
                $eventServiceUrl = config('services.event_catalog.url', 'http://event-catalog-service:8080');
                // EventCatalogService utilise /events/{id} sans préfixe /api
                $response = Http::timeout(5)->get("{$eventServiceUrl}/events/{$eventId}");
                
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

                    return [
                        'id' => $eventId,
                        'title' => $data['title'] ?? $data['name'] ?? 'Événement',
                        'date' => $data['date'] ?? $data['eventDate'] ?? null,
                        'location' => $location,
                    ];
                }
            } catch (\Exception $e) {
                Log::warning("TicketResource: Impossible de récupérer les infos de l'événement #{$eventId}: " . $e->getMessage());
            }

            // Retourner des données par défaut si l'appel échoue
            return [
                'id' => $eventId,
                'title' => "Événement #{$eventId}",
                'date' => null,
                'location' => 'Non spécifié',
            ];
        });
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Récupérer les informations de l'événement
        $eventInfo = $this->fetchEventInfo($this->event_id);

        return [
            'id' => $this->id,
            'ticket_uuid' => $this->ticket_uuid,
            'event_id' => $this->event_id,
            'user_id' => $this->user_id,
            'ticket_type' => $this->ticket_type,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'total_price' => $this->total_price,
            'status' => $this->status->value,
            'status_description' => $this->status->description(),
            'status_color' => $this->status->color(),
            'qr_payload' => $this->qr_payload,
            'print_url' => $this->print_url,
            'created_at' => $this->created_at->toIso8601String(),
            'used_at' => $this->used_at?->toIso8601String(),
            'payment' => [
                'id' => $this->payment_id,
                'transaction_id' => $this->payment?->transaction_id,
            ],
            // Informations de l'événement
            'event' => $eventInfo,
            'eventTitle' => $eventInfo['title'],
            'eventDate' => $eventInfo['date'],
            'eventLocation' => $eventInfo['location'],
        ];
    }
}
