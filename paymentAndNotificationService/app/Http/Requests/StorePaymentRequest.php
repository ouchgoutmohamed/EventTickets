<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'currency' => 'required|string|size:3',
            'user_id' => 'required|integer', 
            'event_id' => 'required|integer', 
            'ticket_id' => 'required|integer', 
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|string',
        ];
    }
}
