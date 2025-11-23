<?php

namespace App\Models;

use App\Casts\MoneyCast;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', // To link payment to the customer.
        'transaction_id', // Unique ID for tracking (UUID).
        'amount', // How much the user pays.
        'currency', // Always store currency (USD, MAD…), even if always same.
        'status', // PENDING, SUCCESS, FAILED, REFUNDED.
        'method', // Payment method: card, paypal, bank_transfer…
        'reason', // Why it failed or was refunded.
        'provider', // Ex: stripe, paypal, cash_on_delivery. Useful later.
        'event_id',
        'ticket_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => MoneyCast::class,
        ];
    }

    public function notification()
    {
        return $this->hasMany(Notification::class);
    }

}
