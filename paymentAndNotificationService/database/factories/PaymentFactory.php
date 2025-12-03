<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'transaction_id' => fake()->uuid(),
            'user_id' => fake()->numberBetween(),
            'event_id' => fake()->numberBetween(),
            'ticket_id' => fake()->numberBetween(),
            'amount' => fake()->numberBetween(100, 300),
            'method' => fake()->randomElement(PaymentMethod::cases())
        ];
    }
}
