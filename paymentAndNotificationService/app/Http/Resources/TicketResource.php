<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource pour formater les données d'un ticket en JSON.
 */
class TicketResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
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
        ];
    }
}
