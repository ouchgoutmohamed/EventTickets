<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserPaymentsTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_returns_payments_for_user()
    {
        Payment::factory()->count(3)->create(['user_id' => 1]);
        Payment::factory()->count(2)->create(['user_id' => 2]);

        $response = $this->getJson('/api/payments?user_id=1');

        $response->assertOk();
        $response->assertJsonCount(3);
    }
}
