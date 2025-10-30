<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // return parent::toArray($request);
        return [
            'id' => $this->id,
            'amount' => $this->amount,
            'method' => $this->method,
            'status' => $this->status,
            'user_id' => $this->user_id,
            'event_id' => $this->event_id,
            'ticket_id' => $this->ticket_id,
            'transaction_id' => $this->transaction_id,
        ];
    }
}
