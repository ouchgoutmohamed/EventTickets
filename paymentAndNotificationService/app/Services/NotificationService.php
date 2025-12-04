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
        $token = request()->bearerToken();

        [$header, $payload, $signature] = explode(".", $token);

        $urlSafe = strtr($payload, '-_', '+/');
        $padded = $urlSafe . str_repeat('=', (4 - strlen($urlSafe) % 4) % 4);
        $payloadJson = base64_decode($padded);
        $payloadArray = json_decode($payloadJson, true);

        $nom = $payloadArray['nom'] ?? null;
        $prenom = $payloadArray['email'] ?? null;
        $email = $payloadArray['email'] ?? null;
        
        $subject = match ($payment->status) {
            PaymentStatus::SUCCESS->value => 'Payment Successful',
            PaymentStatus::FAILED->value  => 'Payment Failed',
            PaymentStatus::REFUNDED->value => 'Payment Refunded',
            default   => 'Payment Update',
        };

        $message = "Hello {$nom} {$prenom}, your payment status: {$payment->status}.";

        // Save notification in DB
        \App\Models\Notification::create([
            'user_id' => $payment->user_id,
            'payment_id' => $payment->id,
            'type' => $subject,
            'message' => $message,
        ]);

        // Send an actual email
        Mail::raw($message, function ($mail) use ($email, $subject) {
            $mail->to($email)->subject($subject);
        });
    }
}
