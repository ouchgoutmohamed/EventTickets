<?php

use App\Http\Controllers\Api\V1\PaymentController;
use Illuminate\Support\Facades\Route;

Route::prefix('payments')->group(function () {
    Route::post('/', [PaymentController::class, 'execute']);
    Route::post('/{id}/refund', [PaymentController::class, 'refund']);
    Route::get('/user/{userId}', [PaymentController::class, 'userPayments']);
});
