<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;

class NotificationService
{
    public function sendPaymentStatus(Payment $payment): void
    {
        // Fetch user from Users Service
        $user = Http::get(env("USERS_SERVICE_URL") . "/api/users/{$payment->user_id}")
                    ->throw()
                    ->json();

        $subject = match ($payment->status->value) {
            'SUCCESS' => 'Payment Successful',
            'FAILED'  => 'Payment Failed',
            'REFUNDED' => 'Payment Refunded',
            default   => 'Payment Update',
        };

        $message = "Hello {$user['name']}, your payment status: {$payment->status->value}.";

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
