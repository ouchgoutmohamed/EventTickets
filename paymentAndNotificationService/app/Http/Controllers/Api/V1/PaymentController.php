<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequest;
use App\Services\PaymentService;
use App\Services\NotificationService;
use App\Models\Payment;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected NotificationService $notificationService
    ) {}

    public function execute(PaymentRequest $request)
    {
        $payment = $this->paymentService->execute($request->validated());
        $this->notificationService->sendPaymentStatus($payment);

        return response()->json($payment, 201);
    }

    public function refund($id)
    {
        $payment = Payment::findOrFail($id);
        $refunded = $this->paymentService->refund($payment);
        $this->notificationService->sendPaymentStatus($refunded);

        return response()->json($refunded);
    }

    public function userPayments($userId)
    {
        $payments = $this->paymentService->getUserPayments($userId);
        return response()->json($payments);
    }
}
