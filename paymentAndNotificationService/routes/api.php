<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\PaymentController;

Route::prefix('v1')->group(function () {
    Route::get('payments', [PaymentController::class, 'index']);
    Route::get('payments/{payment}', [PaymentController::class, 'show']);
    
    Route::post('payments', [PaymentController::class, 'store']);
});
