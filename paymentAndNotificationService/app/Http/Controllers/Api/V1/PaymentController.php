<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Services\PaymentService;
use App\Services\NotificationService;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected NotificationService $notificationService
    ) {
    }

    public function execute(PaymentRequest $request)
    {
        $payment = $this->paymentService->execute($request->validated());
        $this->notificationService->sendPaymentStatus($payment);

        return response()->json(new PaymentResource($payment), 201);
    }

    public function show(Payment $payment)
    {
        return new PaymentResource($payment);
    }

    public function refund(Payment $payment)
    {
        $refunded = $this->paymentService->refund($payment);
        $this->notificationService->sendPaymentStatus($refunded);

        return response()->json($refunded);
    }

    public function userPayments(Request $request)
    {
        $user_id = $request->query("user_id");
        $request->validate([
            'user_id' => 'required|integer'
        ]);
        $payments = $this->paymentService->getUserPayments($user_id);
        return response()->json($payments);
    }
}
