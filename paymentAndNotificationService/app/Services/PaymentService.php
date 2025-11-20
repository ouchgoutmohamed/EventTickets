<?php

namespace App\Services;

use App\Models\Payment;
use App\Enums\PaymentStatus;
use Illuminate\Support\Str;
use Exception;

class PaymentService
{
    public function execute(array $data): Payment
    {
        $payment = Payment::create([
            'user_id' => $data['user_id'],
            'transaction_id' => Str::uuid(),
            'amount' => $data['amount'],
            'method' => $data['method'],
            'status' => PaymentStatus::PENDING,
        ]);

        try {
            // Simulate payment gateway logic here
            $success = rand(0, 1); // Fake outcome

            if ($success) {
                $payment->update(['status' => PaymentStatus::SUCCESS]);
            } else {
                $payment->update([
                    'status' => PaymentStatus::FAILED,
                    'reason' => 'Insufficient funds',
                ]);
            }

            return $payment;
        } catch (Exception $e) {
            $payment->update([
                'status' => PaymentStatus::FAILED,
                'reason' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function refund(Payment $payment, string $reason = null): Payment
    {
        if ($payment->status !== PaymentStatus::SUCCESS) {
            throw new Exception('Only successful payments can be refunded');
        }

        $payment->update([
            'status' => PaymentStatus::REFUNDED,
            'reason' => $reason ?? 'Refund issued by admin',
        ]);

        return $payment;
    }

    public function getUserPayments(int $userId)
    {
        return Payment::where('user_id', $userId)->latest()->get();
    }
}
