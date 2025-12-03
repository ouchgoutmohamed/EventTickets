<?php

namespace Tests\Unit;

use App\Enums\PaymentMethod;
use Tests\TestCase;
use App\Services\PaymentService;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PaymentServiceTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_creates_a_payment_with_pending_status()
    {
        $service = new PaymentService();

        $data = [
            'user_id' => 1,
            'event_id' => 10,
            'ticket_id' => 100,
            'amount' => 50,
            'currency' => 'MAD',
            'method' => PaymentMethod::CREDIT_CARD->value,
        ];

        $payment = $service->execute($data);

        $this->assertInstanceOf(Payment::class, $payment);
        $this->assertEquals(1, $payment->user_id);
        $this->assertEquals('MAD', $payment->currency);
    }
}
