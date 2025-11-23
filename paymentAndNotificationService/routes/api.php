<?php

use App\Http\Controllers\Api\V1\PaymentController;
use Illuminate\Support\Facades\Route;

Route::prefix('payments')->group(function () {
    Route::post('/', [PaymentController::class, 'execute']);
    Route::post('/{payment}/refund', [PaymentController::class, 'refund']);

    Route::get('/', [PaymentController::class, 'userPayments']);
    Route::get('/{payment}', [PaymentController::class, 'show']);
});
