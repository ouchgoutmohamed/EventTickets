<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use App\Models\Payment;
use App\Enums\PaymentStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RefundPaymentTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_cannot_refund_a_failed_payment()
    {
        $payment = Payment::factory()->create([
            'status' => PaymentStatus::FAILED,
        ]);

        $response = $this->postJson("/api/payments/{$payment->id}/refund");

        $response->assertStatus(500);
    }
}
