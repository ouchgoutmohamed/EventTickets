<?php

namespace Database\Factories;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory pour générer des tickets de test.
 *
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ticket>
 */
class TicketFactory extends Factory
{
    protected $model = Ticket::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $ticketUuid = Str::uuid()->toString();
        
        return [
            'ticket_uuid' => $ticketUuid,
            'user_id' => fake()->numberBetween(1, 100),
            'event_id' => fake()->numberBetween(1, 50),
            'payment_id' => fake()->numberBetween(1, 200),
            'reservation_id' => fake()->optional()->numberBetween(1, 200),
            'qr_payload' => base64_encode(json_encode([
                'ticket_uuid' => $ticketUuid,
                'timestamp' => now()->timestamp,
            ])) . '.' . substr(md5($ticketUuid), 0, 16),
            'ticket_type' => fake()->randomElement(['Standard', 'VIP', 'Premium', 'Early Bird']),
            'quantity' => 1,
            'unit_price' => fake()->numberBetween(100, 2000),
            'status' => TicketStatus::GENERATED,
            'used_at' => null,
        ];
    }

    /**
     * Ticket utilisé (scanné à l'entrée).
     */
    public function used(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TicketStatus::USED,
            'used_at' => now(),
        ]);
    }

    /**
     * Ticket annulé.
     */
    public function canceled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TicketStatus::CANCELED,
        ]);
    }

    /**
     * Ticket expiré.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TicketStatus::EXPIRED,
        ]);
    }

    /**
     * Ticket VIP.
     */
    public function vip(): static
    {
        return $this->state(fn (array $attributes) => [
            'ticket_type' => 'VIP',
            'unit_price' => fake()->numberBetween(1000, 5000),
        ]);
    }
}
