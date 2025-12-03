<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use Illuminate\Support\Facades\Mail;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;

class NotificationService
{
    public function sendPaymentStatus(Payment $payment): void
    {
        // Fetch user from Users Service
        $user = Http::get(config('services.users.url') . "/api/users/{$payment->user_id}")
                    ->throw()
                    ->json();

        $subject = match ($payment->status) {
            PaymentStatus::SUCCESS->value => 'Payment Successful',
            PaymentStatus::FAILED->value  => 'Payment Failed',
            PaymentStatus::REFUNDED->value => 'Payment Refunded',
            default   => 'Payment Update',
        };

        $message = "Hello {$user['name']}, your payment status: {$payment->status}.";

        // Save notification in DB
        \App\Models\Notification::create([
            'user_id' => $payment->user_id,
            'payment_id' => $payment->id,
            'type' => $subject,
            'message' => $message,
        ]);

        // Send an actual email
        Mail::raw($message, function ($mail) use ($user, $subject) {
            $mail->to($user['email'])->subject($subject);
        });
    }
}
