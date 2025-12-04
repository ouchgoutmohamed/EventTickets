<?php

namespace App\Services;

use App\Models\Payment;
use App\Enums\PaymentStatus;
use Illuminate\Support\Str;
use Exception;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

class PaymentService
{
    public function execute(array $data): Payment
    {
        $payment = Payment::create([
            'user_id' => $data['user_id'],
            'event_id' => $data['event_id'],
            'ticket_id' => $data['ticket_id'],
            'amount' => $data['amount'],
            'currency' => $data['currency'],
            'method' => $data['method'],
            'status' => PaymentStatus::PENDING,
        ]);

        try {
            // Simulate payment gateway logic here
            $success = rand(0, 1); // Fake outcome

            if ($success) {
                $payment->update([
                    'status' => PaymentStatus::SUCCESS,
                    'transaction_id' => Str::uuid(),
                ]);
            } else {
                $payment->update([
                    'status' => PaymentStatus::FAILED,
                    'reason' => 'Insufficient funds',
                ]);
            }

            if (!app()->environment('testing')) {
                $connection = new AMQPStreamConnection(config("services.rabbitmq.url"), 5672, 'guest', 'guest');
                $channel = $connection->channel();

                $channel->queue_declare('payment', false, true, false, false);

                $msg = $success ? PaymentStatus::SUCCESS->value : PaymentStatus::FAILED->value;
                $msg = new AMQPMessage($msg, [
                    'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT
                ]);
                $channel->basic_publish($msg, '', 'status');

                $channel->close();
                $connection->close();
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

    public function refund(Payment $payment, ?string $reason = null): Payment
    {
        if ($payment->status !== PaymentStatus::SUCCESS->value) {
            throw new Exception('Only successful payments can be refunded');
        }

        $payment->update([
            'status' => PaymentStatus::REFUNDED,
            'reason' => $reason ?? 'Refund issued by admin',
        ]);

        return $payment;
    }

    public function getUserPayments(string $userId)
    {
        return Payment::where('user_id', $userId)->latest()->get();
    }
}
