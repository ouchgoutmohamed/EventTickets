<?php

namespace Tests\Feature;

use App\Enums\PaymentMethod;
use Tests\TestCase;
use App\Models\Payment;
use App\Services\PaymentService;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

class PaymentControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_validates_payment_request()
    {
        $response = $this->postJson('/api/payments', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['user_id', 'event_id', 'ticket_id', 'currency', 'amount', 'method']);
    }

    /** @test */
    public function it_executes_a_payment()
    {
        // Prevent external HTTP and email
        $this->mock(NotificationService::class, function ($mock) {
            $mock->shouldReceive('sendPaymentStatus')->once();
        });

        $payload = [
            'user_id' => 1,
            'event_id' => 10,
            'ticket_id' => 100,
            'currency' => 'MAD',
            'amount' => 99.99,
            'method' => PaymentMethod::CREDIT_CARD->value,
        ];

        $response = $this->postJson('/api/payments', $payload);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'id',
            'user_id',
            'status',
            'amount',
            'method',
        ]);
    }
}
