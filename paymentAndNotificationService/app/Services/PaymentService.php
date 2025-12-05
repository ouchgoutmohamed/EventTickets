<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Ticket;
use App\Enums\PaymentStatus;
use Illuminate\Support\Str;
use Exception;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    /**
     * Service de gestion des tickets.
     */
    protected TicketService $ticketService;

    public function __construct(TicketService $ticketService)
    {
        $this->ticketService = $ticketService;
    }

    public function execute(array $data): Payment
    {
        $payment = Payment::create([
            'user_id' => $data['user_id'],
            'event_id' => $data['event_id'],
            'ticket_id' => $data['ticket_id'],
            'reservation_id' => $data['reservation_id'] ?? null,
            'amount' => $data['amount'],
            'currency' => $data['currency'],
            'method' => $data['method'],
            'status' => PaymentStatus::PENDING->value,
        ]);

        try {
            // Simulate payment gateway logic here (always success for now)
            $payment->update([
                'status' => PaymentStatus::SUCCESS->value,
                'transaction_id' => Str::uuid(),
            ]);

            // === GÉNÉRATION AUTOMATIQUE DU TICKET APRÈS PAIEMENT RÉUSSI ===
            // Le ticket est généré de manière idempotente (pas de doublon)
            try {
                $ticket = $this->ticketService->generateTicketForPayment($payment);
                Log::info("🎟️ Ticket généré automatiquement après paiement", [
                    'payment_id' => $payment->id,
                    'ticket_uuid' => $ticket->ticket_uuid,
                ]);
            } catch (Exception $ticketException) {
                // Log l'erreur mais ne bloque pas le paiement
                Log::error("❌ Erreur lors de la génération du ticket: " . $ticketException->getMessage());
            }

            // Publier le message RabbitMQ pour le TicketInventoryService
            $this->publishPaymentStatus($payment, true);

            return $payment;
        } catch (Exception $e) {
            $payment->update([
                'status' => PaymentStatus::FAILED,
                'reason' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Publie le statut du paiement sur RabbitMQ pour le TicketInventoryService.
     */
    private function publishPaymentStatus(Payment $payment, bool $success): void
    {
        if (app()->environment('testing')) {
            return;
        }

        try {
            $rabbitmqHost = config("services.rabbitmq.url", "localhost");
            $connection = new AMQPStreamConnection($rabbitmqHost, 5672, 'guest', 'guest');
            $channel = $connection->channel();

            // Déclarer la queue 'payment' (compatible avec l'ancien format)
            $channel->queue_declare('payment', false, true, false, false);
            
            // Déclarer la queue 'payment-status' pour les messages JSON structurés
            $channel->queue_declare('payment-status', false, true, false, false);

            // Message JSON structuré pour le TicketInventoryService
            $messageData = [
                'reservationId' => $payment->reservation_id,
                'userId' => $payment->user_id,
                'eventId' => $payment->event_id,
                'status' => $payment->status->value,
                'transactionId' => $payment->transaction_id,
                'reason' => $payment->reason,
                'paymentId' => $payment->id,
                'timestamp' => now()->toIso8601String(),
            ];

            // Publier sur la queue 'payment-status' (format JSON)
            $jsonMessage = new AMQPMessage(json_encode($messageData), [
                'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT,
                'content_type' => 'application/json',
            ]);
            $channel->basic_publish($jsonMessage, '', 'payment-status');

            // Publier aussi sur 'payment' pour compatibilité (format simple)
            $simpleMessage = new AMQPMessage($payment->status->value, [
                'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT
            ]);
            $channel->basic_publish($simpleMessage, '', 'payment');

            Log::info("📤 Message RabbitMQ publié: status={$payment->status->value}, reservationId={$payment->reservation_id}");

            $channel->close();
            $connection->close();
        } catch (Exception $e) {
            Log::error("❌ Erreur publication RabbitMQ: " . $e->getMessage());
            // Ne pas bloquer le paiement si RabbitMQ échoue
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

        // Publier le remboursement sur RabbitMQ
        $this->publishPaymentStatus($payment, false);

        return $payment;
    }

    public function getUserPayments(string $userId)
    {
        return Payment::where('user_id', $userId)->latest()->get();
    }
}
