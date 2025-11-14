<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\PaymentStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{

    public function index(Request $request)
    {
        $query = Payment::query();

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $payments = $query->latest()->get();

        return PaymentResource::collection($payments);
    }

    public function show(Payment $payment)
    {
        return new PaymentResource($payment);
    }
    public function store(StorePaymentRequest $request)
    {
        $payment = Payment::create($request->validated());

        // Optionally trigger async notification:
        // event(new PaymentCreated($payment));

        $isSuccessful = true; // simulate success/failure

        if ($isSuccessful) {
            $payment->update([
                'status' => PaymentStatus::SUCCESS,
                'transaction_id' => 'FAKE-' . strtoupper(Str::random(10)),
            ]);
        } else {
            $payment->update([
                'status' => 'failed',
            ]);
        }

        // Step 3. Return resource
        return new PaymentResource($payment);
    }
}
