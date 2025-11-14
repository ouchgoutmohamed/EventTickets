<?php

namespace App\Http\Requests;

use App\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => 'required|integer', 
            'event_id' => 'required|integer', 
            'ticket_id' => 'required|integer', 
            'currency' => 'required|string|size:3',
            'amount' => 'required|numeric|min:0.01',
            'method' => ['required', Rule::in(array_column(PaymentMethod::cases(), 'value')),],
            // 'status' => ['required', Rule::in(array_column(PaymentStatus::cases(), 'value')),]
        ];
    }
}
