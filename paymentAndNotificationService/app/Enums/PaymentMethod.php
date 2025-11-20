<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CREDIT_CARD = "Credit Card";
    case PAYPAL = "Paypal";
    case STRIPE = "Stripe";
}
